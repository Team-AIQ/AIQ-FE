import { API_ENDPOINTS } from "@/constants/api";
import { KeyboardAwareScreen } from "@/components/keyboard-aware-screen";
import { AppColors } from "@/constants/theme";
import { apiRequest, isApiError } from "@/lib/api-client";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
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

type Step = "email" | "code" | "reset";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(300);
  const [codeError, setCodeError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const codeInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (step !== "code" || timer <= 0) return;

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
  }, [step, timer]);

  const isValidEmail = /\S+@\S+\.\S+/.test(email);

  const validatePassword = (value: string) => {
    const regex = /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,16}$/;
    return regex.test(value);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const requestPasswordCode = async () => {
    await apiRequest(API_ENDPOINTS.PASSWORD_CODE_REQUEST, {
      method: "POST",
      body: { email },
    });
  };

  const handleSendCode = async () => {
    if (!isValidEmail) {
      setEmailError("올바른 이메일을 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    setEmailError("");

    try {
      await requestPasswordCode();
      setStep("code");
      setTimer(300);
      setResendMessage("");
      setCode(["", "", "", "", "", ""]);
    } catch (error) {
      setEmailError(
        isApiError(error) ? error.message : "이메일을 확인해 주세요.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeInput = (value: string) => {
    if (!/^\d*$/.test(value)) return;

    const next = value.slice(0, 6).split("");
    while (next.length < 6) next.push("");

    setCode(next);
    setCodeError("");
  };

  const handleResend = async () => {
    setIsLoading(true);
    setCodeError("");

    try {
      await requestPasswordCode();
      setTimer(300);
      setCode(["", "", "", "", "", ""]);
      setResendMessage("코드가 재전송되었습니다.");
      setTimeout(() => setResendMessage(""), 3000);
    } catch (error) {
      setCodeError(
        isApiError(error) ? error.message : "코드 재전송에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const verificationCode = code.join("");
    if (verificationCode.length !== 6) return;

    setIsLoading(true);
    setCodeError("");

    try {
      await apiRequest(API_ENDPOINTS.PASSWORD_VERIFY, {
        method: "POST",
        body: {
          email,
          code: verificationCode,
        },
      });

      setStep("reset");
    } catch (error) {
      setCodeError(
        isApiError(error)
          ? error.message
          : "인증 코드가 올바르지 않습니다.",
      );
    } finally {
      setIsLoading(false);
    }
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

  const handleResetPassword = async () => {
    if (!validatePassword(password)) {
      setPasswordError("영문, 숫자, 특수문자를 포함한 8~16자로 입력해 주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest(API_ENDPOINTS.PASSWORD_RESET, {
        method: "POST",
        body: {
          email,
          password,
          passwordConfirm,
        },
      });

      Alert.alert("재설정 완료", "새 비밀번호로 다시 로그인해 주세요.", [
        {
          text: "확인",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "오류",
        isApiError(error)
          ? error.message
          : "비밀번호 재설정에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "email") {
      router.back();
      return;
    }

    if (step === "code") {
      setStep("email");
      return;
    }

    setStep("code");
  };

  const isCodeComplete = code.every((digit) => digit !== "");
  const isPasswordValid =
    password.length > 0 &&
    passwordConfirm.length > 0 &&
    validatePassword(password) &&
    password === passwordConfirm;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <KeyboardAwareScreen style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Image
              source={require("../../assets/images/back-icon.png")}
              style={styles.backIconImage}
            />
          </TouchableOpacity>

          {step === "email" ? (
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.titleGreen}>비밀번호 재설정</Text>
                <Text style={styles.subtitle}>
                  AIQ에 가입한 이메일을 입력해 주세요.
                </Text>
              </View>

              <View style={styles.formArea}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>이메일</Text>
                  <TextInput
                    style={[styles.input, emailError ? styles.inputError : null]}
                    placeholder="이메일을 입력하세요"
                    placeholderTextColor={AppColors.gray}
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
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
                  style={[
                    styles.button,
                    isValidEmail && !isLoading ? styles.buttonActive : null,
                  ]}
                  disabled={!isValidEmail || isLoading}
                  onPress={handleSendCode}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "전송 중..." : "다음"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {step === "code" ? (
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.titleGreen}>이메일을 확인하세요</Text>
                <Text style={styles.subtitle}>
                  메일로 전송된 6자리 인증 코드를 입력해 주세요.
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
                          codeError ? styles.codeBoxError : null,
                        ]}
                      >
                        <Text style={styles.codeText}>{digit}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>

                <TextInput
                  ref={codeInputRef}
                  style={styles.hiddenInput}
                  value={code.join("")}
                  onChangeText={handleCodeInput}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />

                {codeError ? (
                  <Text style={styles.errorTextCentered}>{codeError}</Text>
                ) : null}
                {resendMessage ? (
                  <Text style={styles.resendMessage}>{resendMessage}</Text>
                ) : null}

                <View style={styles.codeButtonRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionButton,
                      timer > 0 ? styles.secondaryActionButtonDisabled : null,
                    ]}
                    disabled={timer > 0 || isLoading}
                    onPress={handleResend}
                  >
                    <Text style={styles.secondaryActionText}>재전송</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      isCodeComplete && !isLoading ? styles.buttonActive : null,
                      styles.codeConfirmButton,
                    ]}
                    disabled={!isCodeComplete || isLoading}
                    onPress={handleVerifyCode}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? "확인 중..." : "완료"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}

          {step === "reset" ? (
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.titleGreen}>새 비밀번호 설정</Text>
                <Text style={styles.subtitle}>
                  새로운 비밀번호를 입력하고 다시 로그인하세요.
                </Text>
              </View>

              <View style={styles.formArea}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>새 비밀번호</Text>
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
                  <Text style={styles.label}>새 비밀번호 확인</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        passwordConfirmError ? styles.inputError : null,
                      ]}
                      placeholder="비밀번호를 한 번 더 입력해 주세요"
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
                  style={[
                    styles.button,
                    isPasswordValid && !isLoading ? styles.buttonActive : null,
                  ]}
                  disabled={!isPasswordValid || isLoading}
                  onPress={handleResetPassword}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "변경 중..." : "완료"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
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
    zIndex: 10,
    padding: 15,
  },
  backIconImage: {
    width: 10,
    height: 20,
    tintColor: AppColors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 110,
  },
  header: {
    marginBottom: 28,
  },
  titleGreen: {
    color: AppColors.primaryGreen,
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    color: AppColors.white,
    fontSize: 14,
    lineHeight: 22,
  },
  formArea: {
    marginTop: 12,
  },
  inputContainer: {
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
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  errorTextCentered: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 14,
    textAlign: "center",
    lineHeight: 18,
  },
  button: {
    height: 52,
    borderRadius: 8,
    backgroundColor: AppColors.gray,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: AppColors.primaryGreen,
  },
  buttonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  codeArea: {
    marginTop: 8,
    alignItems: "center",
  },
  timer: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 18,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  codeBox: {
    width: 46,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.gray,
    justifyContent: "center",
    alignItems: "center",
  },
  codeBoxError: {
    borderColor: "#FF6B6B",
  },
  codeText: {
    color: AppColors.white,
    fontSize: 24,
    fontWeight: "700",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  resendMessage: {
    color: AppColors.primaryGreen,
    fontSize: 12,
    marginTop: 10,
  },
  codeButtonRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  secondaryActionButton: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryActionButtonDisabled: {
    opacity: 0.5,
  },
  secondaryActionText: {
    color: AppColors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  codeConfirmButton: {
    flex: 1,
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
});
