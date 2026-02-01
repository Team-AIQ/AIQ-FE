import { API_ENDPOINTS } from "@/constants/api";
import { AppColors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function SignupScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // 에러 상태
  const [nicknameError, setNicknameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");


  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 비밀번호 유효성 검사 (영문 소문자, 숫자, 특수문자 포함 8-16자)
  const validatePassword = (pwd: string) => {
    const regex = /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[a-z\d@$!%*?&]{8,16}$/;
    return regex.test(pwd);
  };


  const handlePasswordBlur = () => {
    if (password && !validatePassword(password)) {
      setPasswordError("영문 소문자, 숫자, 특수문자 포함 8-16자");
    } else {
      setPasswordError("");
    }
  };

  const handlePasswordConfirmBlur = () => {
    if (passwordConfirm && password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다");
    } else {
      setPasswordConfirmError("");
    }
  };

  // 폼 유효성 검사
  const isFormValid =
    nickname &&
    email &&
    password &&
    passwordConfirm &&
    validatePassword(password) &&
    password === passwordConfirm &&
    agreeTerms;

  const handleSignup = async () => {
    // 디버그: 폼 유효성 상태 확인
    console.log("Form validation:", {
      nickname: !!nickname,
      email: !!email,
      password: !!password,
      passwordConfirm: !!passwordConfirm,
      validatePassword: validatePassword(password),
      passwordMatch: password === passwordConfirm,
      agreeTerms,
      isFormValid,
    });

    if (!isFormValid) {
      Alert.alert("입력 확인", "모든 항목을 올바르게 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Signup API 호출:", API_ENDPOINTS.SIGNUP);
      const response = await fetch(API_ENDPOINTS.SIGNUP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          nickname,
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response:", errorText);
        // 이메일 중복 에러 표시
        setEmailError("이미 사용 중인 이메일입니다");
        setIsLoading(false);
        return;
      }

      // 회원가입 성공
      Alert.alert("회원가입 성공", "로그인 화면으로 이동합니다.", [
        {
          text: "확인",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("오류", "서버와 연결할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileImageUpload = () => {
    // TODO: 이미지 업로드 구현
    console.log("프로필 이미지 업로드");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
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

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 50 }}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}></Text>
          </View>

          {/* 프로필 이미지 */}
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageCircle}>
              <View style={styles.profileIcon}>
                <Text style={styles.profileIconText}>👤</Text>
              </View>
            </View>
          </View>

          {/* 닉네임 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              style={[
                styles.input,
                nicknameError && styles.inputError,
              ]}
              placeholder="최소 1회 설정 후 변경 불가"
              placeholderTextColor={AppColors.gray}
              value={nickname}
              onChangeText={(text) => {
                setNickname(text);
                setNicknameError("");
              }}
            />
            {nicknameError ? (
              <Text style={styles.errorText}>{nicknameError}</Text>
            ) : null}
          </View>

          {/* 이메일 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={[
                styles.input,
                emailError && styles.inputError,
              ]}
              placeholder="ex. aiq@email.com"
              placeholderTextColor={AppColors.gray}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>

          {/* 비밀번호 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  passwordError && styles.inputError,
                ]}
                placeholder="영문 소문자, 숫자, 특수문자 포함 8-16자"
                placeholderTextColor={AppColors.gray}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError("");
                }}
                onBlur={handlePasswordBlur}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
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
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>

          {/* 비밀번호 확인 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  passwordConfirmError && styles.inputError,
                ]}
                placeholder="비밀번호를 한 번 더 입력하세요"
                placeholderTextColor={AppColors.gray}
                value={passwordConfirm}
                onChangeText={(text) => {
                  setPasswordConfirm(text);
                  setPasswordConfirmError("");
                }}
                onBlur={handlePasswordConfirmBlur}
                secureTextEntry={!showPasswordConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
              >
                <Image
                  source={
                    showPasswordConfirm
                      ? require("../../assets/images/password-open.png")
                      : require("../../assets/images/password-hide.png")
                  }
                  style={styles.eyeIconImage}
                />
              </TouchableOpacity>
            </View>
            {passwordConfirmError ? (
              <Text style={styles.errorText}>{passwordConfirmError}</Text>
            ) : null}
          </View>

          {/* 개인정보 이용 동의 */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgreeTerms(!agreeTerms)}
          >
            <View
              style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}
            >
              {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>개인정보 이용 동의</Text>
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => console.log("개인정보 이용 동의 상세")}
            >
              <Text style={styles.detailButtonText}>보기</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* 회원가입 버튼 */}
          <TouchableOpacity
            style={[
              styles.signupButton,
              isFormValid && !isLoading && styles.signupButtonActive,
            ]}
            onPress={handleSignup}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={AppColors.white} />
            ) : (
              <Text
                style={[
                  styles.signupButtonText,
                  isFormValid && styles.signupButtonTextActive,
                ]}
              >
                회원가입
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 30,
    left: 30,
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
    marginTop: 50,
    marginBottom: 30,
  },
  logo: {
    width: width * 0.4,
    height: height * 0.2,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: AppColors.white,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 40,
    position: "relative",
  },
  profileImageCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: AppColors.white,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.black,
  },
  profileIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  profileIconText: {
    fontSize: 48,
  },
  uploadButton: {
    position: "absolute",
    bottom: 0,
    right: width / 2 - 60,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButtonText: {
    fontSize: 16,
  },
  inputContainer: {
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: AppColors.white,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    height: 47,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: AppColors.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 13.5,
    color: AppColors.white,
  },
  inputError: {
    borderColor: AppColors.error,
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
  errorText: {
    fontSize: 12,
    color: AppColors.error,
    marginTop: 6,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 20, // ⬅️ 추가 (위에서 떨어뜨림)
    marginBottom: 40, // ⬅️ 기존 32 → 더 여유 주기
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: AppColors.gray,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: AppColors.primaryGreen,
    borderColor: AppColors.primaryGreen,
  },
  checkmark: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: AppColors.white,
  },
  required: {
    color: AppColors.error,
  },
  detailButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  detailButtonText: {
    fontSize: 13,
    color: AppColors.white,
    textDecorationLine: "underline",
  },
  signupButton: {
    marginHorizontal: 40,
    marginTop: -25, // ⬅️ 살짝 위로 당김 (핵심)
    height: 52,
    backgroundColor: AppColors.gray,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  signupButtonActive: {
    backgroundColor: AppColors.primaryGreen,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white,
  },
  signupButtonTextActive: {
    color: AppColors.white,
  },
  bottomSpacer: {
    height: 40,
  },
});
