import { KeyboardAwareScreen } from "@/components/keyboard-aware-screen";
import { LegalModal } from "@/components/legal-modal";
import { API_ENDPOINTS } from "@/constants/api";
import { PRIVACY_POLICY } from "@/constants/legal";
import { AppColors } from "@/constants/theme";
import { apiRequest, isApiError } from "@/lib/api-client";
import { saveUserProfile } from "@/lib/user-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

type EmailStatus = "idle" | "sending" | "sent" | "verified";

export default function SignupScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [emailStatusMessage, setEmailStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const searchParams = useLocalSearchParams<{ email?: string; verified?: string }>();

  const isValidEmail = /\S+@\S+\.\S+/.test(email);
  const originParam = Constants.appOwnership === "expo" ? "expo" : "app";

  const validatePassword = (value: string) => {
    const regex = /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
    return regex.test(value);
  };

  const handlePasswordBlur = () => {
    if (password && !validatePassword(password)) {
      setPasswordError("영문, 숫자, 특수문자를 포함한 8~16자로 입력해 주세요.");
      return;
    }

    setPasswordError("");
  };

  const handlePasswordConfirmBlur = () => {
    if (passwordConfirm && password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setPasswordConfirmError("");
  };

  const handleSendVerification = async () => {
    if (!isValidEmail) {
      setEmailError("올바른 이메일을 입력해 주세요.");
      return;
    }

    setEmailError("");
    setEmailStatus("sending");
    setEmailStatusMessage("");

    try {
      const requestUrl = `${API_ENDPOINTS.EMAIL_REQUEST}?email=${encodeURIComponent(
        email.trim(),
      )}&origin=${originParam}`;

      await apiRequest(requestUrl, {
        method: "POST",
      });

      setEmailStatus("sent");
      setEmailStatusMessage(
        "인증 메일을 발송했습니다. 메일의 링크를 확인해 주세요.",
      );
    } catch (error) {
      setEmailStatus("idle");
      setEmailError(
        isApiError(error) ? error.message : "인증 메일 발송에 실패했습니다.",
      );
    }
  };

  const handleConfirmVerification = () => {
    if (emailStatus === "verified") {
      setEmailStatusMessage("이메일 인증이 완료되었습니다.");
      return;
    }

    Alert.alert(
      "인증 확인",
      "이메일에 온 인증 링크를 눌러 주세요. 앱으로 돌아오면 자동으로 인증됩니다.",
    );
  };

  useEffect(() => {
    const handleUrl = (url: string) => {
      const parsed = Linking.parse(url);
      const path = parsed.path ?? "";

      if (path === "signup-success" || url.startsWith("aiq://signup-success")) {
        const emailFromLink =
          typeof parsed.queryParams?.email === "string"
            ? parsed.queryParams.email
            : "";

        if (emailFromLink) {
          setEmail(emailFromLink);
        }

        setEmailStatus("verified");
        setEmailStatusMessage("이메일 인증이 완료되었습니다.");
      }
    };

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!searchParams) return;

    const verifiedParam = searchParams.verified;
    const emailParam = searchParams.email;

    if (typeof emailParam === "string" && emailParam) {
      setEmail(emailParam);
    }

    if (verifiedParam === "1" || verifiedParam === "true") {
      setEmailStatus("verified");
      setEmailStatusMessage("이메일 인증이 완료되었습니다.");
    }
  }, [searchParams]);

  const isFormValid =
    nickname.trim().length > 0 &&
    isValidEmail &&
    password.length > 0 &&
    passwordConfirm.length > 0 &&
    validatePassword(password) &&
    password === passwordConfirm &&
    agreeTerms &&
    emailStatus === "verified";

  const handleSignup = async () => {
    if (!isFormValid) {
      Alert.alert("입력 확인", "모든 항목을 올바르게 입력해 주세요.");
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest(API_ENDPOINTS.SIGNUP, {
        method: "POST",
        body: {
          email,
          password,
          nickname,
        },
      });

      await saveUserProfile({
        nickname: nickname.trim(),
        email: email.trim(),
      });

      Alert.alert("회원가입 성공", "로그인 화면으로 이동합니다.", [
        {
          text: "확인",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
    } catch (error) {
      if (isApiError(error)) {
        setEmailError(error.message);
      } else {
        Alert.alert("오류", "서버에 연결할 수 없습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <KeyboardAwareScreen
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        lockScrollWhenKeyboardHidden
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Image
            source={require("../../assets/images/back-icon.png")}
            style={styles.backIconImage}
          />
        </TouchableOpacity>

          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageCircle}>
              <Image
                source={require("../../assets/images/hello-pickle.png")}
                style={styles.profileImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>이메일</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithButtonField,
                  emailError ? styles.inputError : null,
                  emailStatus === "verified" ? styles.verifiedInput : null,
                ]}
                placeholder="ex. aiq@email.com"
                placeholderTextColor={AppColors.gray}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setEmailError("");
                  setEmailStatus("idle");
                  setEmailStatusMessage("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <TouchableOpacity
                style={[
                  styles.inputButton,
                  isValidEmail ? styles.inputButtonActive : null,
                ]}
                disabled={!isValidEmail || emailStatus === "sending"}
                onPress={handleSendVerification}
              >
                <Text style={styles.inputButtonText}>
                  {emailStatus === "sending" ? "발송 중" : "중복확인"}
                </Text>
              </TouchableOpacity>
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
            {emailStatusMessage ? (
              <Text
                style={[
                  styles.statusText,
                  emailStatus === "verified"
                    ? styles.statusTextSuccess
                    : undefined,
                ]}
              >
                {emailStatusMessage}
              </Text>
            ) : null}
            {emailStatus === "sent" ? (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleConfirmVerification}
              >
                <Text style={styles.verifyButtonText}>인증 확인</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              style={[styles.input, nicknameError ? styles.inputError : null]}
              placeholder="최초 1회 설정 후 변경 불가"
              placeholderTextColor={AppColors.gray}
              value={nickname}
              onChangeText={(value) => {
                setNickname(value);
                setNicknameError("");
              }}
            />
            {nicknameError ? (
              <Text style={styles.errorText}>{nicknameError}</Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  passwordError ? styles.inputError : null,
                ]}
                placeholder="영문, 숫자, 특수문자를 포함한 8~16자"
                placeholderTextColor={AppColors.gray}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setPasswordError("");
                }}
                onBlur={handlePasswordBlur}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword((prev) => !prev)}
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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  passwordConfirmError ? styles.inputError : null,
                ]}
                placeholder="비밀번호를 한번 더 입력해 주세요."
                placeholderTextColor={AppColors.gray}
                value={passwordConfirm}
                onChangeText={(value) => {
                  setPasswordConfirm(value);
                  setPasswordConfirmError("");
                }}
                onBlur={handlePasswordConfirmBlur}
                secureTextEntry={!showPasswordConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPasswordConfirm((prev) => !prev)}
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

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setLegalOpen(true)}
          >
            <View
              style={[
                styles.checkbox,
                agreeTerms ? styles.checkboxChecked : null,
              ]}
            >
              {agreeTerms ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>개인정보 이용에 동의합니다</Text>
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => setLegalOpen(true)}
            >
              <Text style={styles.detailButtonText}>보기</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.signupButton,
              isFormValid && !isLoading ? styles.signupButtonActive : null,
            ]}
            onPress={handleSignup}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={AppColors.white} />
            ) : (
              <Text style={styles.signupButtonText}>회원가입</Text>
            )}
          </TouchableOpacity>
      </KeyboardAwareScreen>

      <LegalModal
        description={PRIVACY_POLICY}
        open={legalOpen}
        title="개인정보처리방침"
        onAgree={() => {
          setAgreeTerms(true);
          setLegalOpen(false);
        }}
        onClose={() => setLegalOpen(false)}
      />
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
  backButton: {
    position: "absolute",
    top: 30,
    left: 20,
    zIndex: 10,
    padding: 15,
  },
  backIconImage: {
    width: 10,
    height: 20,
    tintColor: AppColors.white,
  },
  scrollContent: {
    paddingTop: 70,
    paddingBottom: 50,
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 43,
    paddingTop: 90,
    marginBottom: 20,
  },
  title: {
    color: AppColors.white,
    fontSize: 24,
    fontWeight: "700",
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileImageCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: AppColors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 92,
    height: 92,
  },
  inputContainer: {
    paddingHorizontal: 43,
    marginBottom: 18,
  },
  label: {
    color: AppColors.white,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: AppColors.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: AppColors.white,
    fontSize: 14,
  },
  inputError: {
    borderColor: "#FF6B6B",
  },
  verifiedInput: {
    borderColor: AppColors.primaryGreen,
  },
  inputWithButton: {
    position: "relative",
  },
  inputWithButtonField: {
    paddingRight: 88,
  },
  inputButton: {
    position: "absolute",
    right: 8,
    top: 8,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.gray,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(10, 10, 10, 0.6)",
  },
  inputButtonActive: {
    borderColor: AppColors.primaryGreen,
    backgroundColor: "rgba(63, 221, 144, 0.12)",
  },
  inputButtonText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: "600",
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
    top: 10,
    padding: 4,
  },
  eyeIconImage: {
    width: 22,
    height: 22,
    tintColor: AppColors.gray,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  statusText: {
    color: AppColors.gray,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  statusTextSuccess: {
    color: AppColors.primaryGreen,
  },
  verifyButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
  },
  verifyButtonText: {
    color: AppColors.primaryGreen,
    fontSize: 12,
    fontWeight: "600",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 43,
    marginTop: 6,
    marginBottom: 28,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.gray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    borderColor: AppColors.primaryGreen,
    backgroundColor: AppColors.primaryGreen,
  },
  checkmark: {
    color: AppColors.black,
    fontSize: 12,
    fontWeight: "700",
  },
  checkboxLabel: {
    flex: 1,
    color: AppColors.white,
    fontSize: 13,
  },
  detailButton: {
    paddingLeft: 8,
  },
  detailButtonText: {
    color: AppColors.primaryGreen,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  signupButton: {
    height: 52,
    marginHorizontal: 43,
    borderRadius: 8,
    backgroundColor: AppColors.gray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  signupButtonActive: {
    backgroundColor: AppColors.primaryGreen,
  },
  signupButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});




