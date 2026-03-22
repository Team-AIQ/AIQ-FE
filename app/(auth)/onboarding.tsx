import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "@/constants/theme";
import MatrixBackground from "@/components/MatrixBackground";

const { width, height } = Dimensions.get("window");
const IS_SMALL = height < 740;

type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
  step: number; // 어느 단계의 메시지인지
  isFirstOfStep: boolean; // 해당 단계의 첫 AI 메시지인지
};

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(true); // AI 메시지 출력 중인지
  const scrollViewRef = useRef<ScrollView>(null);

  const getProgress = () => step * 25;

  const pushAiMessagesSequentially = async (texts: string[], currentStep: number) => {
    setIsTyping(true);
    for (let i = 0; i < texts.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${i}`,
          sender: "ai",
          text: texts[i],
          step: currentStep,
          isFirstOfStep: i === 0,
        },
      ]);
    }
    setIsTyping(false);
  };

  useEffect(() => {
    pushAiMessagesSequentially([
      "만나서 반가워 지구인!",
      "나는 AIQ 행성에서 온 Pickle(피클)이야. 🛸",
      "지구에는 없는 '워프쇼핑'을 알려주려고 멀리서 날아왔어.",
      "지구인의 '시간'이라는 귀한 자원을 아껴줄 AIQ 방식을 소개해 줄게!",
    ], 1);
  }, []);

  const handleUserSelect = async (userText: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        sender: "user",
        text: userText,
        step: step,
        isFirstOfStep: false,
      },
    ]);

    const nextStep = (step + 1) as 2 | 3 | 4;
    setStep(nextStep);

    if (nextStep === 2) {
      await pushAiMessagesSequentially([
        "지구인들은 물건 하나 살 때 여러 개의 탭을 띄우고 몇 시간씩 비교한다며?😵‍💫",
        "우리 행성에서는 그걸 '선향적 노동'이라고 불러.",
        "검색하고, 대조하고, 망설이는 비효율적인 시간 말이야.",
        "혹시 너도 최근에 뭘 살지 고민하느라 에너지를 낭비한 적 있어?",
      ], 2);
    }

    if (nextStep === 3) {
      await pushAiMessagesSequentially([
        "그 시간을 짧게 압축시켜 주는 게 바로 워프쇼핑이야!⚡",
        "네가 필요한 제품에 대한 질문을 던지면",
        "내가 GPT, Perplexity, Gemini의 답변을 불러 모을거야.",
        "너는 거기에 답만 하면 끝이야!",
      ], 3);
    }

    if (nextStep === 4) {
      await pushAiMessagesSequentially([
        "응! 분석이 끝나면 AI들의 합의점과 추천 제품을 담은 리포트를 보낼거야.",
        "이제 더 이상 망설임 없이 '확신'만 남을 거야.",
        "자, 준비됐어? 네 장바구니 속 고민을 나에게 보여줄래?",
      ], 4);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        {/* 매트릭스 배경 (이미지 없으면 검정 배경) */}
        <View style={styles.matrixBackground} />

        {/* 상단 진행바 */}
        <View style={styles.topBar}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[styles.progressBarFill, { width: `${getProgress()}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{getProgress()}%</Text>
          </View>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipIcon}>👽</Text>
            <Text style={styles.skipText}>건너뛰기</Text>
          </TouchableOpacity>
        </View>

        {/* 채팅 영역 - 초록 테두리 + 매트릭스 배경 */}
        <View style={styles.chatBorderContainer}>
          <MatrixBackground />
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) =>
              msg.sender === "ai" ? (
                <View key={msg.id} style={styles.aiMessageContainer}>
                  {/* 단계별 첫 메시지에만 아바타 표시 */}
                  {msg.isFirstOfStep && (
                    <View style={styles.aiAvatarRow}>
                      <View style={styles.aiAvatar}>
                        <Image
                          source={require("../../assets/images/hello-pickle.png")}
                          style={styles.aiAvatarImage}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  )}
                  <View style={styles.aiMessageBubble}>
                    <Text style={styles.aiMessageText}>{msg.text}</Text>
                  </View>
                </View>
              ) : (
                <View key={msg.id} style={styles.userMessageContainer}>
                  <View style={styles.userMessageBubble}>
                    <Text style={styles.userMessageText}>{msg.text}</Text>
                  </View>
                </View>
              ),
            )}
          </ScrollView>
        </View>

        {/* 하단 버튼 영역 */}
        <View style={styles.buttonArea}>
          {step === 1 && (
            <View style={[styles.buttonRow, IS_SMALL ? styles.buttonRowStack : null]}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, isTyping && styles.buttonDisabled]}
                onPress={() => handleUserSelect("워프쇼핑이 뭐야?")}
                disabled={isTyping}
              >
                <Text style={styles.primaryButtonText}>워프쇼핑이 뭐야?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, isTyping && styles.buttonDisabled]}
                onPress={() => handleUserSelect("응! 어서 알려줘")}
                disabled={isTyping}
              >
                <Text style={styles.secondaryButtonText}>응! 어서 알려줘</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <TouchableOpacity
              style={[styles.button, styles.fullButton, isTyping && styles.buttonDisabled]}
              onPress={() =>
                handleUserSelect("있어, 비교하는 게 너무 귀찮고 힘들었어.")
              }
              disabled={isTyping}
            >
              <Text style={styles.fullButtonText}>
                있어, 비교하는 게 너무 귀찮고 힘들었어.
              </Text>
            </TouchableOpacity>
          )}

          {step === 3 && (
            <TouchableOpacity
              style={[styles.button, styles.fullButton, isTyping && styles.buttonDisabled]}
              onPress={() =>
                handleUserSelect("오, 여러 AI 의견을 한 번에 정리해 주는구나!")
              }
              disabled={isTyping}
            >
              <Text style={styles.fullButtonText}>
                오, 여러 AI 의견을 한 번에 정리해 주는구나!
              </Text>
            </TouchableOpacity>
          )}

          {step === 4 && (
            <TouchableOpacity
              style={[styles.button, styles.fullButton, isTyping && styles.buttonDisabled]}
              onPress={() => router.replace("/(tabs)")}
              disabled={isTyping}
            >
              <Text style={styles.fullButtonText}>좋아, 바로 시작할게!</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  matrixBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AppColors.black,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 1,
  },
  progressBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: AppColors.primaryGreen,
    borderRadius: 0,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 12,
    color: AppColors.white,
    fontFamily: "Galmuri9",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  skipIcon: {
    fontSize: 16,
  },
  skipText: {
    color: AppColors.white,
    fontFamily: "Galmuri9",
    fontSize: 12,
  },
  chatBorderContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: AppColors.primaryGreen,
    borderRadius: 16,
    overflow: "hidden",
    zIndex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  aiMessageContainer: {
    marginBottom: 12,
    alignItems: "flex-start",
  },
  aiAvatarRow: {
    marginBottom: 4,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.black,
    justifyContent: "center",
    alignItems: "center",
  },
  aiAvatarImage: {
    width: 28,
    height: 28,
  },
  aiMessageBubble: {
    maxWidth: "85%",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderWidth: 0.5,
    borderColor: AppColors.primaryGreen,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    // 네온 효과
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  aiMessageText: {
    color: AppColors.white,
    fontFamily: "Galmuri9",
    fontSize: IS_SMALL ? 11 : 12,
    lineHeight: IS_SMALL ? 18 : 20,
  },
  userMessageContainer: {
    marginBottom: 12,
    alignItems: "flex-end",
  },
  userMessageBubble: {
    maxWidth: "85%",
    backgroundColor: AppColors.primaryGreen,
    borderRadius: 16,
    borderTopRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    // 네온 효과
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  userMessageText: {
    color: AppColors.black,
    fontSize: IS_SMALL ? 12 : 13,
    fontWeight: "600",
    lineHeight: IS_SMALL ? 18 : 20,
  },
  buttonArea: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 12,
    zIndex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  buttonRowStack: {
    flexDirection: "column",
  },
  button: {
    minHeight: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
    paddingVertical: 12,
    paddingHorizontal: 14,
    // 네온 효과 강화
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: AppColors.primaryGreen,
  },
  primaryButtonText: {
    color: AppColors.black,
    fontSize: IS_SMALL ? 11 : 13,
    fontWeight: "700",
    lineHeight: IS_SMALL ? 18 : 20,
    textAlign: "center",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "rgba(229, 229, 229, 0.9)",
  },
  secondaryButtonText: {
    color: AppColors.black,
    fontSize: IS_SMALL ? 11 : 13,
    fontWeight: "700",
    lineHeight: IS_SMALL ? 18 : 20,
    textAlign: "center",
  },
  fullButton: {
    width: "100%",
    backgroundColor: "rgba(229, 229, 229, 0.9)",
  },
  fullButtonText: {
    color: AppColors.black,
    fontSize: IS_SMALL ? 11 : 13,
    fontWeight: "600",
    lineHeight: IS_SMALL ? 18 : 20,
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
