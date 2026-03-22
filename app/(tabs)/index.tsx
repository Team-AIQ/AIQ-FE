import { MenuDrawer } from "@/components/menu-drawer";
import { API_ENDPOINTS } from "@/constants/api";
import { AppColors } from "@/constants/theme";
import { clearAuthTokens, getAccessToken } from "@/lib/auth-storage";
import { apiRequest, isApiError } from "@/lib/api-client";
import {
  buildReportSession,
  CategoryQuestion,
  getReportSession,
  saveReportSession,
} from "@/lib/report-session";
import {
  addChatHistory,
  AIProviderSettings,
  ChatHistoryItem,
  clearSessionData,
  decrementCredits,
  getAIProviderSettings,
  getChatHistory,
  getCredits,
  getUserProfile,
  saveAIProviderSettings,
  setCredits,
  UserProfile,
} from "@/lib/user-session";
import type { CurationAnswerResponse, CurationResponse } from "@/types/api";
import { useFocusEffect } from "@react-navigation/native";
import { jwtDecode } from "jwt-decode";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

type Message = {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: Date;
  options?: string[];
};

const DEFAULT_PROVIDER_SETTINGS: AIProviderSettings = {
  chatgpt: true,
  gemini: true,
  perplexity: true,
};

const HELP_TEXT = [
  "검색하고 싶은 제품 조건을 자연스럽게 입력하면 AIQ가 카테고리 질문을 이어갑니다.",
  "리포트가 생성되면 Chat GPT, Gemini, Perplexity 관점의 추천 결과를 비교할 수 있습니다.",
  "메뉴에서 AI 응답 설정, 크레딧, 최근 대화, 프로필 편집을 관리할 수 있습니다.",
];

const REPORT_CREATING_MESSAGE = "리포트를 생성하고 있어요. 잠시만 기다려 주세요.";

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ continue?: string; provider?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [curationData, setCurationData] = useState<CurationResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credits, setCreditsState] = useState(100);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [providerSettings, setProviderSettings] = useState<AIProviderSettings>(
    DEFAULT_PROVIDER_SETTINGS,
  );
  const flatListRef = useRef<FlatList>(null);
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const syncCredits = async (value: number) => {
    setCreditsState(value);
    await setCredits(value);
  };

  const loadUserData = useCallback(async () => {
    const [nextProfile, nextCredits, nextHistory, nextSettings] = await Promise.all([
      getUserProfile(),
      getCredits(),
      getChatHistory(),
      getAIProviderSettings(),
    ]);

    setProfile(nextProfile);
    setCreditsState(nextCredits);
    setHistory(nextHistory);
    setProviderSettings(nextSettings);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData]),
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const keyboardHideListener = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [bounceAnim, floatAnim, glowAnim]);

  useEffect(() => {
    if (params.continue !== "1") return;

    let mounted = true;

    const hydrate = async () => {
      const session = await getReportSession();
      if (!mounted || !session) return;

      const providerLabel =
        params.provider === "gemini"
          ? "Gemini"
          : params.provider === "perplexity"
            ? "Perplexity"
            : params.provider === "chatgpt"
              ? "Chat GPT"
              : "선택한 리포트";

      setMessages([
        {
          id: `${Date.now()}-continue-0`,
          type: "ai",
          text: `${providerLabel} 기준 리포트를 바탕으로 이어서 질문할 수 있어요.`,
          timestamp: new Date(),
        },
        {
          id: `${Date.now()}-continue-1`,
          type: "ai",
          text: session.summary,
          timestamp: new Date(),
        },
      ]);
      setInputText(session.initialQuestion);
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, [params.continue, params.provider]);

  const appendMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const resetConversation = () => {
    setMessages([]);
    setInputText("");
    setCurationData(null);
    setCurrentQuestionIndex(0);
    setInitialQuestion("");
  };

  const completeReportFlow = async (questions: CategoryQuestion[]) => {
    if (!curationData) return;

    const reportSession = buildReportSession({
      categoryName: curationData.categoryName,
      initialQuestion,
      questions,
    });

    await saveReportSession(reportSession);
    const nextCredits = await decrementCredits(20);
    setCreditsState(nextCredits);
    setCurationData(null);
    setCurrentQuestionIndex(0);
    setInitialQuestion("");
    router.push("/(tabs)/report-loading");
  };

  const getNextPendingQuestionIndex = (questions: CategoryQuestion[]) =>
    questions.findIndex((question) => !question.user_answer);

  const askNextQuestionLocal = async (answer: string) => {
    if (!curationData) return;

    const updatedQuestions = curationData.questions.map((question, index) =>
      index === currentQuestionIndex
        ? { ...question, user_answer: answer }
        : question,
    );

    setCurationData({ ...curationData, questions: updatedQuestions });

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < updatedQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      appendMessage({
        id: `${Date.now()}-next`,
        type: "ai",
        text: updatedQuestions[nextIndex].question_text,
        timestamp: new Date(),
        options: updatedQuestions[nextIndex].options,
      });
      scrollToBottom();
      return;
    }

    appendMessage({
      id: `${Date.now()}-complete`,
      type: "ai",
      text: REPORT_CREATING_MESSAGE,
      timestamp: new Date(),
    });
    scrollToBottom();
    await completeReportFlow(updatedQuestions);
  };

  const askNextQuestion = async (answer: string) => {
    if (!curationData) return;

    const updatedQuestions = curationData.questions.map((question, index) =>
      index === currentQuestionIndex
        ? { ...question, user_answer: answer }
        : question,
    );

    setCurationData({ ...curationData, questions: updatedQuestions });

    try {
      const response = await apiRequest<CurationAnswerResponse>(API_ENDPOINTS.CURATION_ANSWER, {
        method: "POST",
        requireAuth: true,
        body: {
          queryId: curationData.queryId,
          questionIndex: currentQuestionIndex,
          attributeKey: curationData.questions[currentQuestionIndex]?.attribute_key,
          answer,
        },
      });

      const nextQuestions = response.questions ?? updatedQuestions;
      const nextCategoryName = response.categoryName ?? curationData.categoryName;
      const nextMessage = response.message;

      setCurationData({
        queryId: response.queryId ?? curationData.queryId,
        categoryName: nextCategoryName,
        questions: nextQuestions,
        message: nextMessage ?? curationData.message,
      });

      if (nextMessage) {
        appendMessage({
          id: `${Date.now()}-server-message`,
          type: "ai",
          text: nextMessage,
          timestamp: new Date(),
        });
      }

      if (response.done || response.reportReady) {
        appendMessage({
          id: `${Date.now()}-complete`,
          type: "ai",
          text: REPORT_CREATING_MESSAGE,
          timestamp: new Date(),
        });
        scrollToBottom();
        await completeReportFlow(nextQuestions);
        return;
      }

      if (response.nextQuestion) {
        const nextIndex = nextQuestions.findIndex(
          (question) => question.attribute_key === response.nextQuestion?.attribute_key,
        );
        setCurrentQuestionIndex(nextIndex >= 0 ? nextIndex : currentQuestionIndex + 1);
        appendMessage({
          id: `${Date.now()}-next`,
          type: "ai",
          text: response.nextQuestion.question_text,
          timestamp: new Date(),
          options: response.nextQuestion.options,
        });
        scrollToBottom();
        return;
      }

      const pendingIndex = getNextPendingQuestionIndex(nextQuestions);
      if (pendingIndex >= 0) {
        setCurrentQuestionIndex(pendingIndex);
        appendMessage({
          id: `${Date.now()}-next`,
          type: "ai",
          text: nextQuestions[pendingIndex].question_text,
          timestamp: new Date(),
          options: nextQuestions[pendingIndex].options,
        });
        scrollToBottom();
        return;
      }

      appendMessage({
        id: `${Date.now()}-complete`,
        type: "ai",
        text: REPORT_CREATING_MESSAGE,
        timestamp: new Date(),
      });
      scrollToBottom();
      await completeReportFlow(nextQuestions);
    } catch {
      await askNextQuestionLocal(answer);
    }
  };

  const startCuration = async (questionText: string) => {
    setIsLoading(true);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        Alert.alert("로그인 필요", "로그인 후 이용해 주세요.");
        return;
      }

      const decoded = jwtDecode<{ userId: number }>(accessToken);
      const data = await apiRequest<CurationResponse>(API_ENDPOINTS.CURATION_START, {
        method: "POST",
        requireAuth: true,
        body: {
          userId: decoded.userId,
          question: questionText,
        },
      });

      setCurationData(data);
      setCurrentQuestionIndex(0);
      setInitialQuestion(questionText);
      await addChatHistory(questionText);
      setHistory(await getChatHistory());

      appendMessage({
        id: `${Date.now()}-category`,
        type: "ai",
        text: data.message || `${data.categoryName} 카테고리로 정리했어요.`,
        timestamp: new Date(),
      });

      if (data.questions.length > 0) {
        appendMessage({
          id: `${Date.now()}-question`,
          type: "ai",
          text: data.questions[0].question_text,
          timestamp: new Date(),
          options: data.questions[0].options,
        });
      }

      scrollToBottom();
    } catch (error) {
      Alert.alert(
        "오류",
        isApiError(error) ? error.message : "서버와 연결할 수 없습니다.",
      );
      appendMessage({
        id: `${Date.now()}-error`,
        type: "ai",
        text: "일시적인 문제가 생겼어요. 다시 시도해 주세요.",
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const questionText = inputText.trim();
    appendMessage({
      id: Date.now().toString(),
      type: "user",
      text: questionText,
      timestamp: new Date(),
    });
    setInputText("");

    if (curationData) {
      await askNextQuestion(questionText);
      return;
    }

    await startCuration(questionText);
  };

  const handleOptionSelect = async (option: string) => {
    if (isLoading) return;

    appendMessage({
      id: Date.now().toString(),
      type: "user",
      text: option,
      timestamp: new Date(),
    });
    await askNextQuestion(option);
  };

  const dismissKeyboard = () => Keyboard.dismiss();

  const handleToggleProvider = async (
    key: keyof AIProviderSettings,
    value: boolean,
  ) => {
    const nextSettings = { ...providerSettings, [key]: value };
    setProviderSettings(nextSettings);
    await saveAIProviderSettings(nextSettings);
  };

  const handleCreditReward = async () => {
    const nextValue = credits + 1;
    await syncCredits(nextValue);
    setCreditsOpen(false);
    Alert.alert("크레딧 적립", "광고 시청 보상으로 1 크레딧이 적립되었습니다.");
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await Promise.all([clearAuthTokens(), clearSessionData()]);
    router.replace("/(auth)/welcome");
  };

  const handleWithdraw = () => {
    Alert.alert(
      "회원탈퇴",
      "탈퇴하면 계정과 저장된 정보가 초기화됩니다. 계속할까요?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "계속",
          style: "destructive",
          onPress: async () => {
            setIsMenuOpen(false);
            await Promise.all([clearAuthTokens(), clearSessionData()]);
            router.replace("/(auth)/welcome");
          },
        },
      ],
    );
  };

  const firstUserMessageId = messages.find((message) => message.type === "user")?.id;
  const glowRadius = glowAnim.interpolate({
    inputRange: [0.3, 0.6],
    outputRange: [10, 18],
  });

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.type === "user";
    const isFirstUserMessage = isUser && item.id === firstUserMessageId;
    const hasOptions = !isUser && item.options && item.options.length > 0;

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!isUser ? (
          <View style={styles.aiAvatarRow}>
            <View style={styles.aiAvatar}>
              <Image
                source={require("../../assets/images/hello-pickle.png")}
                style={styles.aiAvatarImage}
                resizeMode="contain"
              />
            </View>
          </View>
        ) : null}
        {isFirstUserMessage ? (
          <View style={styles.userAvatarRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarIcon}>U</Text>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.aiText,
            ]}
          >
            {item.text}
          </Text>
        </View>

        {hasOptions ? (
          <View style={styles.optionsContainer}>
            {item.options!.map((option) => (
              <TouchableOpacity
                key={`${item.id}-${option}`}
                style={styles.optionButton}
                onPress={() => handleOptionSelect(option)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionButtonText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.characterContainer}>
        <Animated.View
          style={[
            styles.characterCircle,
            {
              shadowColor: AppColors.primaryGreen,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: glowAnim,
              shadowRadius: glowRadius,
              elevation: 10,
            },
          ]}
        >
          <Animated.Image
            source={require("../../assets/images/hello-pickle.png")}
            style={[styles.characterImage, { transform: [{ translateY: floatAnim }] }]}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={styles.characterSubtitle}>만나서 반가워! 난 피클이야.</Text>
        <Text style={styles.characterSubtitle}>
          필요한 제품 조건을 말해주면 질문을 이어갈게.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.pressableContainer} onPress={dismissKeyboard}>
          <View style={styles.header}>
            <TouchableOpacity onPress={resetConversation}>
              <Image
                source={require("../../assets/images/onboarding-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={() => setIsMenuOpen(true)}>
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
          </View>

          {messages.length > 0 ? (
            <View style={styles.chatBorderContainer}>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={scrollToBottom}
              />
            </View>
          ) : (
            <View style={styles.emptyWrapper}>{renderEmpty()}</View>
          )}

          {messages.length === 0 ? (
            <Animated.View
              style={[
                styles.tooltipContainer,
                { transform: [{ translateY: bounceAnim }] },
              ]}
            >
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>
                  검색하고 싶은 제품 조건을 입력해 보세요
                </Text>
              </View>
              <View style={styles.tooltipArrow} />
            </Animated.View>
          ) : null}

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="무엇이든 물어보세요"
                placeholderTextColor={AppColors.gray}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <Image
                  source={
                    inputText.trim()
                      ? require("../../assets/images/sending-icon-green.png")
                      : require("../../assets/images/sending-icon.png")
                  }
                  style={styles.sendIconImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

          </View>
        </Pressable>
      </KeyboardAvoidingView>

      <MenuDrawer
        open={isMenuOpen}
        profile={profile}
        credits={credits}
        history={history}
        settings={providerSettings}
        onClose={() => setIsMenuOpen(false)}
        onToggleProvider={handleToggleProvider}
        onOpenHelp={() => {
          setIsMenuOpen(false);
          setHelpOpen(true);
        }}
        onOpenCredits={() => {
          setIsMenuOpen(false);
          setCreditsOpen(true);
        }}
        onEditProfile={() => {
          setIsMenuOpen(false);
          router.push("/(tabs)/profile");
        }}
        onLogout={handleLogout}
        onWithdraw={handleWithdraw}
      />

      <Modal
        animationType="fade"
        transparent
        visible={helpOpen}
        onRequestClose={() => setHelpOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>도움말</Text>
            {HELP_TEXT.map((line) => (
              <Text key={line} style={styles.modalBody}>
                • {line}
              </Text>
            ))}
            <TouchableOpacity style={styles.modalButton} onPress={() => setHelpOpen(false)}>
              <Text style={styles.modalButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={creditsOpen}
        onRequestClose={() => setCreditsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>크레딧</Text>
            <Text style={styles.creditNumber}>{credits} credits</Text>
            <Text style={styles.modalBody}>
              리포트 생성 시 20 크레딧이 차감됩니다. 광고 보기 버튼으로 1 크레딧을
              적립할 수 있습니다.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleCreditReward}>
              <Text style={styles.modalButtonText}>광고 보고 1C 받기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalTextButton}
              onPress={() => setCreditsOpen(false)}
            >
              <Text style={styles.modalTextButtonLabel}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  pressableContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logo: {
    left: -15,
    width: 100,
    height: 40,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: AppColors.white,
  },
  chatBorderContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 0.3,
    borderColor: AppColors.primaryGreen,
    borderRadius: 16,
    overflow: "hidden",
  },
  emptyWrapper: {
    flex: 1,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: height - 400,
  },
  characterContainer: {
    alignItems: "center",
  },
  characterCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: AppColors.black,
    borderWidth: 2,
    borderColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  characterImage: {
    width: 200,
    height: 200,
  },
  characterSubtitle: {
    fontSize: 13,
    fontFamily: "Galmuri9",
    color: AppColors.white,
    marginBottom: 10,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  aiMessageContainer: {
    alignItems: "flex-start",
  },
  aiAvatarRow: {
    marginBottom: 4,
  },
  userAvatarRow: {
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
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.black,
    borderWidth: 2,
    borderColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarIcon: {
    fontSize: 13,
    color: AppColors.primaryGreen,
    fontWeight: "700",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  aiBubble: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
    borderTopLeftRadius: 4,
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  userBubble: {
    backgroundColor: AppColors.primaryGreen,
    borderTopRightRadius: 4,
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  messageText: {
    fontSize: 12.5,
    lineHeight: 22,
  },
  userText: {
    color: AppColors.black,
    fontSize: 14,
    fontWeight: "bold",
  },
  aiText: {
    color: AppColors.white,
    fontFamily: "Galmuri9",
  },
  tooltipContainer: {
    alignItems: "center",
    marginBottom: 3,
  },
  tooltip: {
    backgroundColor: AppColors.black,
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  tooltipText: {
    fontFamily: "Galmuri9",
    fontSize: 12,
    color: AppColors.white,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: AppColors.primaryGreen,
    marginTop: -1,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: AppColors.black,
    maxHeight: 50,
    paddingVertical: 8,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
    top: 2,
  },
  sendIconImage: {
    width: 32,
    height: 32,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 8,
  },
  optionButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  optionButtonText: {
    color: AppColors.primaryGreen,
    fontSize: 13,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.3)",
  },
  modalTitle: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalBody: {
    color: AppColors.lightGray,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  creditNumber: {
    color: AppColors.primaryGreen,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  modalButtonText: {
    color: AppColors.black,
    fontSize: 15,
    fontWeight: "700",
  },
  modalTextButton: {
    alignItems: "center",
    marginTop: 14,
  },
  modalTextButtonLabel: {
    color: AppColors.white,
    fontSize: 14,
  },
});
