import { AppColors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
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

const { width } = Dimensions.get("window");

type Step = "email" | "code" | "reset";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  // 현재 단계
  const [step, setStep] = useState<Step>("email");

  // Step 1: 이메일
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Step 2: 인증 코드
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(300);
  const [codeError, setCodeError] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Step 3: 비밀번호 재설정
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");

  // 타이머 (Step 2)
  useEffect(() => {
    if (step !== "code") return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Step 1: 이메일 전송
  const handleSendCode = async () => {
    if (!email) return;
    try {
      console.log("인증 코드 발송:", email);
      setStep("code");
      setTimer(300);
    } catch (error) {
      setEmailError("이메일이 올바르지 않습니다");
    }
  };

  // Step 2: 코드 입력
  const handleCodeInput = (value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = value.split("").slice(0, 6);
    while (newCode.length < 6) newCode.push("");
    setCode(newCode);
    setCodeError(false);
  };

  const handleResend = async () => {
    try {
      console.log("인증 코드 재발송:", email);
      setTimer(300);
      setCode(["", "", "", "", "", ""]);
      setResendMessage("코드가 재전송 되었습니다");
      setTimeout(() => setResendMessage(""), 3000);
    } catch (error) {
      console.error("Resend code error:", error);
    }
  };

  const handleVerifyCode = async () => {
    const verificationCode = code.join("");
    if (verificationCode.length !== 6) return;

    try {
      console.log("인증 코드 확인:", verificationCode);
      setStep("reset");
    } catch (error) {
      setCodeError(true);
    }
  };

  // Step 3: 비밀번호 재설정
  const validatePassword = (pwd: string) => {
    const regex = /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[a-z\d@$!%*?&#]{8,16}$/;
    return regex.test(pwd);
  };

  const handlePasswordBlur = () => {
    if (password && !validatePassword(password)) {
      setPasswordError("비밀번호가 올바르지 않습니다");
    } else {
      setPasswordError("");
    }
  };

  const handlePasswordConfirmBlur = () => {
    if (passwordConfirm && password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 올바르지 않습니다");
    } else {
      setPasswordConfirmError("");
    }
  };

  const handleResetPassword = async () => {
    if (!validatePassword(password) || password !== passwordConfirm) return;

    try {
      console.log("비밀번호 재설정 완료");
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Reset password error:", error);
    }
  };

  const handleBack = () => {
    if (step === "email") {
      router.back();
    } else if (step === "code") {
      setStep("email");
    } else {
      setStep("code");
    }
  };

  const isCodeComplete = code.every((digit) => digit !== "");
  const isPasswordValid =
    password &&
    passwordConfirm &&
    validatePassword(password) &&
    password === passwordConfirm;

  const codeInputRef = useRef<TextInput>(null);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.container}>
          {/* 뒤로가기 버튼 */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Image
              source={require("../../assets/images/back-icon.png")}
              style={styles.backIconImage}
            />
          </TouchableOpacity>

          {/* Step 1: 이메일 입력 */}
          {step === "email" && (
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.titleGreen}>비밀번호 재설정</Text>
                <Text style={styles.subtitle}>
                  'AIQ'에 가입했던 이메일을 입력해주세요
                </Text>
              </View>

              <View style={styles.formArea}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>이메일</Text>
                  <TextInput
                    style={[styles.input, emailError && styles.inputError]}
                    placeholder="이메일을 입력하세요"
                    placeholderTextColor={AppColors.gray}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setEmailError("");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[styles.button, email && styles.buttonActive]}
                  onPress={handleSendCode}
                  disabled={!email}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      email && styles.buttonTextActive,
                    ]}
                  >
                    다음
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: 인증 코드 입력 */}
          {step === "code" && (
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.titleGreen}>이메일을 확인하세요</Text>
                <Text style={styles.subtitle}>
                  이메일에 전송된 코드를 입력하세요
                </Text>
              </View>

              <View style={styles.codeArea}>
                <Text style={styles.timer}>{formatTime(timer)}</Text>

                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => codeInputRef.current?.focus()}
                >
                  <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                      <View
                        key={index}
                        style={[
                          styles.codeBox,
                          codeError && styles.codeBoxError,
                        ]}
                      >
                        <Text style={styles.codeText}>{digit ? "*" : ""}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>

                {/* 숨겨진 입력 필드 */}
                <TextInput
                  ref={codeInputRef}
                  style={styles.hiddenInput}
                  value={code.join("")}
                  onChangeText={handleCodeInput}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />

                {resendMessage ? (
                  <Text style={styles.successText}>{resendMessage}</Text>
                ) : null}
              </View>

              <View style={styles.bottomButtons}>
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResend}
                >
                  <Text style={styles.resendButtonText}>재전송</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.completeButton,
                    isCodeComplete && styles.buttonActive,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={!isCodeComplete}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCodeComplete && styles.buttonTextActive,
                    ]}
                  >
                    완료
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: 비밀번호 재설정 */}
          {step === "reset" && (
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.titleGreen}>비밀번호 재설정</Text>
                <Text style={styles.subtitle}>
                  'AIQ'에 가입했던 이메일을 입력해주세요
                </Text>
              </View>

              <View style={styles.formArea}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>이메일</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    editable={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>비밀번호</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        passwordError && styles.inputError,
                      ]}
                      placeholder="소문자, 숫자, 특수문자 포함 8-16자"
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
                      onPress={() =>
                        setShowPasswordConfirm(!showPasswordConfirm)
                      }
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
                  style={[
                    styles.button,
                    isPasswordValid && styles.buttonActive,
                  ]}
                  onPress={handleResetPassword}
                  disabled={!isPasswordValid}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isPasswordValid && styles.buttonTextActive,
                    ]}
                  >
                    로그인 하러가기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    left: 30,
    zIndex: 15,
    padding: 15,
  },
  backIconImage: {
    width: 10,
    height: 20,
    tintColor: AppColors.white,
  },
  content: {
    flex: 1,
    paddingTop: 80,
  },
  header: {
    marginBottom: 40,
    paddingHorizontal: 30,
  },
  titleGreen: {
    fontSize: 22,
    fontWeight: "600",
    color: AppColors.primaryGreen,
    marginTop: 20,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: AppColors.white,
    lineHeight: 22,
  },
  formArea: {
    flex: 1,
    paddingHorizontal: 30,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    color: AppColors.white,
    marginBottom: 15,
    fontWeight: "500",
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
  inputError: {
    borderColor: "#FF6666",
  },
  errorText: {
    fontSize: 12,
    color: "#FF6666",
    marginTop: 6,
  },
  button: {
    width: "100%",
    height: 52,
    backgroundColor: AppColors.gray,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: AppColors.primaryGreen,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white,
  },
  buttonTextActive: {
    color: AppColors.white,
  },
  // Step 2: 코드 입력
  codeArea: {
    paddingHorizontal: 30,
    alignItems: "flex-end",
  },
  timer: {
    fontSize: 16,
    color: AppColors.white,
    fontWeight: "600",
    marginBottom: 20,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  codeBox: {
    width: 49,
    height: 56,
    borderWidth: 1,
    borderColor: AppColors.white,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  codeBoxError: {
    borderColor: "#FF6666",
  },
  codeText: {
    fontSize: 30,
    color: AppColors.white,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 63,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 0,
  },
  successText: {
    fontSize: 12,
    color: AppColors.primaryGreen,
    textAlign: "center",
    marginTop: 8,
  },
  bottomButtons: {
    flexDirection: "row",
    paddingHorizontal: 30,
    paddingBottom: 30,
    gap: 12,
  },
  resendButton: {
    flex: 1,
    height: 52,
    backgroundColor: AppColors.gray,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white,
  },
  completeButton: {
    flex: 1,
    height: 52,
    backgroundColor: AppColors.gray,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  // 비밀번호 관련
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 13,
    padding: 4,
  },
  eyeIconImage: {
    width: 24,
    height: 24,
    tintColor: AppColors.gray,
  },
});
