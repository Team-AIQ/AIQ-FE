import { API_ENDPOINTS } from "@/constants/api";
import { AppColors } from "@/constants/theme";
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
    const response = await fetch(API_ENDPOINTS.PASSWORD_CODE_REQUEST, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "인증 코드를 보낼 수 없습니다.");
    }
  };

  const handleSendCode = async () => {
    if (!isValidEmail) {
      setEmailError("올바른 이메일을 입력해주세요.");
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
        error instanceof Error ? error.message : "이메일을 확인해주세요.",
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
        error instanceof Error ? error.message : "코드 재전송에 실패했습니다.",
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
      const response = await fetch(API_ENDPOINTS.PASSWORD_VERIFY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "인증 코드가 올바르지 않습니다.");
      }

      setStep("reset");
    } catch (error) {
      setCodeError(
        error instanceof Error ? error.message : "인증 코드가 올바르지 않습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordBlur = () => {
    if (password && !validatePassword(password)) {
      setPasswordError("영문, 숫자, 특수문자를 포함해 8~16자로 입력해주세요.");
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
      setPasswordError("영문, 숫자, 특수문자를 포함해 8~16자로 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.PASSWORD_RESET, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          passwordConfirm,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "비밀번호 재설정에 실패했습니다.");
      }

      Alert.alert("재설정 완료", "새 비밀번호로 다시 로그인해주세요.", [
        {
          text: "확인",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "오류",
        error instanceof Error ? error.message : "비밀번호 재설정에 실패했습니다.",
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

        <View style={styles.container}>
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
                  AIQ에 가입한 이메일을 입력해주세요.
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
                  메일로 전송된 6자리 인증 코드를 입력해주세요.
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
                  <Text style={styles.successText}>{resendMessage}</Text>
                ) : null}
              </View>

              <View style={styles.bottomButtons}>
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResend}
                  disabled={isLoading}
                >
                  <Text style={styles.resendButtonText}>재전송</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.completeButton,
                    isCodeComplete && !isLoading ? styles.buttonActive : null,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={!isCodeComplete || isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "확인 중..." : "완료"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {step === "reset" ? (
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.titleGreen}>비밀번호 재설정</Text>
                <Text style={styles.subtitle}>새 비밀번호를 입력해주세요.</Text>
              </View>

              <View style={styles.formArea}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>이메일</Text>
                  <TextInput style={styles.input} value={email} editable={false} />
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
                      placeholder="영문, 숫자, 특수문자를 포함해 8~16자"
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
                      placeholder="비밀번호를 한 번 더 입력하세요"
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
                  onPress={handleResetPassword}
                  disabled={!isPasswordValid || isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "재설정 중..." : "로그인하러 가기"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
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
    borderColor: AppColors.error,
  },
  errorText: {
    fontSize: 12,
    color: AppColors.error,
    marginTop: 6,
  },
  errorTextCentered: {
    fontSize: 12,
    color: AppColors.error,
    textAlign: "center",
    marginTop: 12,
  },
  successText: {
    fontSize: 12,
    color: AppColors.primaryGreen,
    textAlign: "center",
    marginTop: 8,
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
  codeArea: {
    paddingHorizontal: 30,
    alignItems: "center",
  },
  timer: {
    alignSelf: "flex-end",
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
    borderColor: AppColors.error,
  },
  codeText: {
    fontSize: 30,
    color: AppColors.white,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 34,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 0,
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
