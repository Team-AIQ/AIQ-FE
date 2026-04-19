import { KeyboardAwareScreen } from "@/components/keyboard-aware-screen";
import { API_ENDPOINTS } from "@/constants/api";
import { AppColors } from "@/constants/theme";
import { apiRequest, isApiError } from "@/lib/api-client";
import { saveAuthTokens } from "@/lib/auth-storage";
import { updateUserProfile } from "@/lib/user-session";
import type { LoginResponse } from "@/types/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const STAR_COUNT = 70;

const generateStars = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const seed = index * 9973;
    const rand = (n: number) => (Math.sin(n) + 1) / 2;
    return {
      x: rand(seed) * width,
      y: rand(seed + 1) * height,
      size: 1 + rand(seed + 2) * 2.1,
      opacity: 0.05 + rand(seed + 3) * 0.15,
    };
  });

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const twinkleAnim = useRef(new Animated.Value(0)).current;
  const stars = useMemo(() => generateStars(STAR_COUNT), []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(twinkleAnim, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(twinkleAnim, {
          toValue: 0,
          duration: 2800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [twinkleAnim]);

  useEffect(() => {
    let mounted = true;

    const loadAutoLoginPreference = async () => {
      const saved = await AsyncStorage.getItem("autoLogin");
      if (mounted) {
        setAutoLogin(saved === "true");
      }

      if (__DEV__) {
        console.log("[Login] autoLogin loaded", {
          checked: saved === "true" ? "ON" : "OFF",
          saved: saved ?? "unset",
        });
      }
    };

    void loadAutoLoginPreference();

    return () => {
      mounted = false;
    };
  }, []);

  const isFormValid = email.length > 0 && password.length > 0;

  const getTokenValue = (
    payload: LoginResponse,
    key: "accessToken" | "refreshToken",
  ): string | undefined => {
    const directValue = payload[key];
    if (typeof directValue === "string" && directValue.length > 0) {
      return directValue;
    }

    const nestedValue = payload.data?.[key];
    return typeof nestedValue === "string" && nestedValue.length > 0
      ? nestedValue
      : undefined;
  };

  const handleLogin = async () => {
    if (!isFormValid || isLoading) return;

    setIsLoading(true);

    console.log("[Login] submitting", {
      endpoint: API_ENDPOINTS.LOGIN,
      email,
      password: password ? "***" : "",
    });
    try {
      const data = await apiRequest<LoginResponse>(API_ENDPOINTS.LOGIN, {
        method: "POST",
        body: {
          email,
          password,
        },
      });

      const accessToken = getTokenValue(data, "accessToken");
      const refreshToken = getTokenValue(data, "refreshToken");

      if (!accessToken || !refreshToken) {
        Alert.alert("로그인 실패", "토큰 응답 형식이 올바르지 않습니다.");
        return;
      }

      await saveAuthTokens(accessToken, refreshToken);

      const externalProfile =
        (data as any)?.profile ?? (data as any)?.user ?? null;
      const profileNickname = externalProfile?.nickname || "";
      const profileEmail = externalProfile?.email || email;

      await updateUserProfile({
        nickname: profileNickname ? profileNickname : undefined,
        email: profileEmail,
      });

      if (autoLogin) {
        await AsyncStorage.setItem("autoLogin", "true");
        if (__DEV__) {
          console.log("[Login] autoLogin saved", {
            checked: "ON",
            saved: "true",
          });
        }
      } else {
        await AsyncStorage.removeItem("autoLogin");
        if (__DEV__) {
          console.log("[Login] autoLogin saved", {
            checked: "OFF",
            saved: "unset",
          });
        }
      }

      const onboardingRequired =
        (await AsyncStorage.getItem("onboarding_required")) === "true";

      router.replace(onboardingRequired ? "/(auth)/onboarding" : "/(tabs)");
    } catch (error) {
      console.error("[Login] error", error);
      if (isApiError(error)) {
        Alert.alert("로그인 실패", error.message);
      } else {
        Alert.alert("오류", "서버와 연결할 수 없습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.spaceBackground} pointerEvents="none">
          <Animated.View
            style={[
              styles.starsLayer,
              {
                opacity: twinkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.55, 0.85],
                }),
              },
            ]}
          >
            {stars.map((star, index) => (
              <View
                key={`star-${index}`}
                style={[
                  styles.star,
                  {
                    left: star.x,
                    top: star.y,
                    width: star.size,
                    height: star.size,
                    opacity: star.opacity,
                  },
                ]}
              />
            ))}
          </Animated.View>
        </View>

        <KeyboardAwareScreen style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Image
              source={require("../../assets/images/back-icon.png")}
              style={styles.backIconImage}
            />
          </TouchableOpacity>

          <View style={styles.logoArea}>
            <Image
              source={require("../../assets/images/auth-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formArea}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="이메일 입력"
                placeholderTextColor={AppColors.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="비밀번호 입력"
                  placeholderTextColor={AppColors.gray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Image
                    source={
                      showPassword
                        ? require("../../assets/images/password-open.png")
                        : require("../../assets/images/password-hide.png")
                    }
                    style={styles.eyeIconImage}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  setAutoLogin((prev) => {
                    const next = !prev;

                    if (__DEV__) {
                      console.log("[Login] autoLogin toggled", {
                        checked: next ? "ON" : "OFF",
                      });
                    }

                    return next;
                  });
                }}
              >
                <Image
                  source={
                    autoLogin
                      ? require("../../assets/images/auto-login-on.png")
                      : require("../../assets/images/auto-login-off.png")
                  }
                  style={styles.checkboxImage}
                />
                <Text style={styles.checkboxLabel}>자동 로그인</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text style={styles.forgotPassword}>비밀번호찾기</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonArea}>
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isFormValid && styles.loginButtonActive,
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleLogin}
                disabled={!isFormValid || isLoading}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.loginButtonText,
                    isFormValid && styles.loginButtonTextActive,
                  ]}
                >
                  {isLoading ? "로그인 중..." : "로그인"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => router.push("/(auth)/signup")}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={styles.signupButtonText}>회원가입</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScreen>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.black,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.black,
  },
  spaceBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#020203",
  },
  starsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 999,
  },
  backButton: {
    position: "absolute",
    top: 30,
    left: 20,
    zIndex: 15,
    padding: 15,
  },
  backIconImage: {
    width: 10,
    height: 20,
    tintColor: AppColors.white,
  },
  logoArea: {
    alignItems: "center",
    marginTop: 110,
    marginBottom: 40,
  },
  logo: {
    width: width * 0.5,
    height: height * 0.25,
  },
  formArea: {
    flex: 1,
    paddingHorizontal: 43,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: AppColors.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: AppColors.white,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 8.5,
    padding: 4,
  },
  eyeIconImage: {
    width: 24,
    height: 24,
    tintColor: AppColors.gray,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  checkboxImage: {
    width: 17,
    height: 17,
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: AppColors.white,
  },
  forgotPassword: {
    fontSize: 14,
    color: AppColors.white,
    textDecorationLine: "underline",
  },
  buttonArea: {
    gap: 12,
  },
  loginButton: {
    width: "100%",
    height: 52,
    backgroundColor: AppColors.gray,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonActive: {
    backgroundColor: AppColors.primaryGreen,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white,
  },
  loginButtonTextActive: {
    color: AppColors.white,
  },
  signupButton: {
    width: "100%",
    height: 52,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: AppColors.white,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white,
  },
  disabledButton: {
    opacity: 0.65,
  },
});
