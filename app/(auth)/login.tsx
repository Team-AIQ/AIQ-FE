import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScreen } from "@/components/keyboard-aware-screen";
import { API_ENDPOINTS } from "@/constants/api";
import { AppColors } from "@/constants/theme";
import { apiRequest, isApiError } from "@/lib/api-client";
import { saveAuthTokens } from "@/lib/auth-storage";
import {
  clearPendingOnboarding,
  hasPendingOnboarding,
  hasSeenOnboarding,
  updateUserProfile,
} from "@/lib/user-session";
import type { LoginResponse } from "@/types/api";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import {
  Alert,
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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      const decoded = jwtDecode<Record<string, unknown>>(accessToken);
      const nicknameFromToken =
        (decoded.nickname as string | undefined) ??
        (decoded.name as string | undefined) ??
        (decoded.userName as string | undefined) ??
        (decoded.username as string | undefined);
      const emailFromToken = (decoded.email as string | undefined) ?? email;
      await updateUserProfile({
        email: emailFromToken,
        nickname: nicknameFromToken,
      });

      if (autoLogin) {
        await AsyncStorage.setItem("autoLogin", "true");
      } else {
        await AsyncStorage.removeItem("autoLogin");
      }
      const userKey =
        (decoded.userId as number | undefined)?.toString() ?? emailFromToken ?? email;
      const alreadySeen = await hasSeenOnboarding(userKey);
      const pending = await hasPendingOnboarding(userKey);
      const isNewUser =
        (decoded.isNewUser as boolean | undefined) ??
        (decoded.newUser as boolean | undefined) ??
        false;
      if (alreadySeen) {
        router.replace("/(tabs)");
      } else if (pending || isNewUser) {
        await clearPendingOnboarding(userKey);
        router.replace("/(auth)/onboarding");
      } else {
        router.replace("/(tabs)");
      }
    } catch (error) {
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
                onPress={() => setAutoLogin(!autoLogin)}
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

              <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
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
