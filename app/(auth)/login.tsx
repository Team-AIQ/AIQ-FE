import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "@/constants/theme";
import { API_ENDPOINTS } from "@/constants/api";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  const isFormValid = email.length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!isFormValid) return;

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        Alert.alert("로그인 실패", "이메일 또는 비밀번호를 확인해주세요.");
        return;
      }

      const data = await response.json();
      const { accessToken, refreshToken } = data;

      // 토큰 저장
      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);

      // 자동 로그인 선택 시 (선택사항)
      if (autoLogin) {
        await AsyncStorage.setItem("autoLogin", "true");
      }

      // 로그인 성공 → 온보딩 or 메인
      router.replace("/(auth)/onboarding");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("오류", "서버와 연결할 수 없습니다.");
    }
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.container}>
          {/* 뒤로가기 버튼 */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Image
              source={require("../../assets/images/back-icon.png")}
              style={styles.backIconImage}
            />
          </TouchableOpacity>

          {/* 로고 영역 */}
          <View style={styles.logoArea}>
            <Image
              source={require("../../assets/images/auth-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* 폼 영역 */}
          <View style={styles.formArea}>
            {/* 이메일 입력 */}
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

            {/* 비밀번호 입력 */}
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

            {/* 자동 로그인 & 비밀번호 찾기 */}
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

              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text style={styles.forgotPassword}>비밀번호찾기</Text>
              </TouchableOpacity>
            </View>

            {/* 버튼 영역 - 간격 58.64 */}
            <View style={styles.buttonArea}>
              {/* 로그인 버튼 */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isFormValid && styles.loginButtonActive,
                ]}
                onPress={handleLogin}
                disabled={!isFormValid}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.loginButtonText,
                    isFormValid && styles.loginButtonTextActive,
                  ]}
                >
                  로그인
                </Text>
              </TouchableOpacity>

              {/* 회원가입 버튼 */}
              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => router.push("/(auth)/signup")}
                activeOpacity={0.8}
              >
                <Text style={styles.signupButtonText}>회원가입</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
});
