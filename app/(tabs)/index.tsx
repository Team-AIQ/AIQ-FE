import { API_ENDPOINTS } from "@/constants/api";
import { AppColors } from "@/constants/theme";
import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "@/lib/auth-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// 카테고리 질문 옵션 타입
type CategoryQuestion = {
  attribute_key: string;
  display_label: string;
  question_text: string;
  options: string[];
  user_answer: string | null;
};

// 큐레이션 응답 타입
type CurationResponse = {
  queryId: number;
  categoryName: string;
  questions: CategoryQuestion[];
  message: string;
};

type Message = {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: Date;
  // AI 메시지의 경우 옵션 버튼 포함 가능
  options?: string[];
  questionIndex?: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // 큐레이션 상태
  const [curationData, setCurationData] = useState<CurationResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 네온 효과 애니메이션
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  // 캐릭터 붕붕 뜨는 애니메이션
  const floatAnim = useRef(new Animated.Value(0)).current;
  // 툴팁 통통 튀는 애니메이션
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 네온 반짝임 애니메이션 (줄임)
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

    // 캐릭터 붕붕 뜨는 애니메이션
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

    // 툴팁 살살 튀는 애니메이션
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

    // 키보드 이벤트 리스너 (iOS는 Will, Android는 Did 사용)
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(
      showEvent,
      () => setKeyboardVisible(true),
    );
    const keyboardHideListener = Keyboard.addListener(
      hideEvent,
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const questionText = inputText.trim();
    setInputText("");

    // 이미 큐레이션 진행 중이면 답변으로 처리
    if (curationData && currentQuestionIndex < curationData.questions.length) {
      const nextIndex = currentQuestionIndex + 1;

      if (nextIndex < curationData.questions.length) {
        // 다음 질문 표시
        setCurrentQuestionIndex(nextIndex);
        const nextQuestion = curationData.questions[nextIndex];
        const questionMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: nextQuestion.question_text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, questionMessage]);
      } else {
        // 모든 질문 완료
        const completeMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: "모든 정보를 받았어요! 최적의 제품을 찾아볼게요 🔍",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, completeMessage]);
        // 큐레이션 세션 초기화 (새 질문 가능하도록)
        setCurationData(null);
        setCurrentQuestionIndex(0);
        // TODO: 답변 제출 API 호출
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return;
    }

    // 새로운 큐레이션 시작
    setIsTyping(true);
    setIsLoading(true);

    try {
      // 저장된 토큰 가져오기
      const accessToken = await getAccessToken();
      console.log("Access token:", accessToken ? "있음" : "없음");

      if (!accessToken) {
        Alert.alert("로그인 필요", "로그인 후 이용해주세요.");
        return;
      }

      // JWT 토큰에서 userId 추출
      const decoded = jwtDecode<{ userId: number }>(accessToken);
      const userId = decoded.userId;
      console.log("User ID:", userId);

      console.log("Curation API 호출:", API_ENDPOINTS.CURATION_START);
      const response = await fetch(API_ENDPOINTS.CURATION_START, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          userId,
          question: questionText,
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error("API 요청 실패");
      }

      const data: CurationResponse = await response.json();
      console.log("Curation response:", data);

      // 큐레이션 데이터 저장
      setCurationData(data);
      setCurrentQuestionIndex(0);

      // AI 메시지 추가 (카테고리 안내)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        text: data.message || `${data.categoryName} 카테고리로 분류되었어요!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // 첫 번째 질문을 옵션 버튼과 함께 추가
      if (data.questions && data.questions.length > 0) {
        const firstQuestion = data.questions[0];
        const questionMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "ai",
          text: firstQuestion.question_text,
          timestamp: new Date(),
          options: firstQuestion.options,
          questionIndex: 0,
        };
        setMessages((prev) => [...prev, questionMessage]);
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Curation error:", error);
      Alert.alert("오류", "서버와 연결할 수 없습니다.");

      // 에러 시 기본 메시지 표시
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        text: "죄송해요, 잠시 문제가 생겼어요. 다시 시도해주세요!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  // 옵션 선택 핸들러
  const handleOptionSelect = (option: string, questionIndex: number) => {
    if (!curationData) return;

    // 사용자 답변 메시지 추가
    const userAnswer: Message = {
      id: Date.now().toString(),
      type: "user",
      text: option,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userAnswer]);

    // 다음 질문이 있으면 표시
    const nextIndex = questionIndex + 1;
    if (nextIndex < curationData.questions.length) {
      setCurrentQuestionIndex(nextIndex);
      const nextQuestion = curationData.questions[nextIndex];
      const questionMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        text: nextQuestion.question_text,
        timestamp: new Date(),
        options: nextQuestion.options,
        questionIndex: nextIndex,
      };
      setMessages((prev) => [...prev, questionMessage]);
    } else {
      // 모든 질문 완료
      const completeMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        text: "모든 정보를 받았어요! 최적의 제품을 찾아볼게요 🔍",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, completeMessage]);
      // TODO: 답변 제출 API 호출
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // 첫 번째 사용자 메시지 ID 찾기
  const firstUserMessageId = messages.find((m) => m.type === "user")?.id;

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
        {/* 아바타 - 말풍선 위에 */}
        {!isUser && (
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
        {isFirstUserMessage && (
          <View style={styles.userAvatarRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarIcon}>👤</Text>
            </View>
          </View>
        )}
        {/* 말풍선 */}
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

        {/* 옵션 버튼들 - AI 메시지에 옵션이 있을 때만 표시 */}
        {hasOptions && (
          <View style={styles.optionsContainer}>
            {item.options!.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleOptionSelect(option, item.questionIndex ?? 0)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionButtonText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const glowRadius = glowAnim.interpolate({
    inputRange: [0.3, 0.6],
    outputRange: [10, 18],
  });

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
            style={[
              styles.characterImage,
              { transform: [{ translateY: floatAnim }] },
            ]}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={styles.characterSubtitle}>만나서 반가워! 난 피클이야</Text>
        <Text style={styles.characterSubtitle}>
          너의 장바구니를 비워줄게 필요한 제품을 말해봐
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <Pressable style={styles.pressableContainer} onPress={dismissKeyboard}>
          {/* 헤더 */}
          <View style={styles.header}>
          <TouchableOpacity onPress={() => setMessages([])}>
            <Image
              source={require("../../assets/images/onboarding-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* 메시지 리스트 - 메시지가 있을 때만 초록색 테두리 */}
        {messages.length > 0 ? (
          <View style={styles.chatBorderContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />
          </View>
        ) : (
          <View style={styles.emptyWrapper}>
            {renderEmpty()}
          </View>
        )}

        {/* 툴팁 - 메시지가 없을 때만 표시 */}
        {messages.length === 0 && (
          <Animated.View
            style={[
              styles.tooltipContainer,
              { transform: [{ translateY: bounceAnim }] },
            ]}
          >
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                검색창에 필요한 제품을 입력해줘
              </Text>
            </View>
            <View style={styles.tooltipArrow} />
          </Animated.View>
        )}

        {/* 입력 영역 */}
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
          {/* 키보드 내리기 버튼 - 입력창과 키보드 사이 중앙 */}
          {keyboardVisible && (
            <TouchableOpacity
              style={styles.dismissButtonCenter}
              onPress={dismissKeyboard}
            >
              <View style={styles.dismissArrow}>
                <Text style={styles.dismissArrowText}>↓</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        </Pressable>
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
  characterName: {
    fontSize: 18,
    fontFamily: "Galmuri9",
    color: AppColors.white,
    marginBottom: 8,
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
    fontSize: 14,
    color: AppColors.primaryGreen,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  // AI 말풍선: 그린 테두리, 검은 배경 (왼쪽 상단 뾰족) + 네온 효과
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
  // 사용자 말풍선: 그린 배경 (오른쪽 상단 뾰족) + 네온 효과
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
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
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
  dismissButtonCenter: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 2,
  },
  dismissArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  dismissArrowText: {
    fontSize: 14,
    color: AppColors.white,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
    top : 2,
  },
  sendIconImage: {
    width: 32,
    height: 32,
  },
  // 옵션 버튼 스타일
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
});
