import { LegalModal } from "@/components/legal-modal";
import { MenuDrawer } from "@/components/menu-drawer";
import StarfieldBackground from "@/components/starfield-background";
import { API_ENDPOINTS } from "@/constants/api";
import { HELP_FAQ } from "@/constants/help";
import { AppColors } from "@/constants/theme";
import { apiRequest, isApiError } from "@/lib/api-client";
import { clearAuthTokens, getAccessToken } from "@/lib/auth-storage";
import { CategoryQuestion, getReportSession } from "@/lib/report-session";
import {
  AIProviderSettings,
  clearSessionData,
  decrementCredits,
  getAIProviderSettings,
  getChatHistory,
  getCredits,
  getHistoryReport,
  getUserProfile,
  saveAIProviderSettings,
  saveHistoryReport,
  setCredits,
  updateUserProfile,
  UserProfile,
} from "@/lib/user-session";
import { parseUserSnapshot } from "@/lib/user-snapshot";
import type {
  AiRecommendationResponse,
  ApiResponse,
  CurationResponse,
  FinalReportResponse,
  HistoryResponseItem,
  TopProduct,
} from "@/types/api";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { jwtDecode } from "jwt-decode";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import EventSource from "react-native-sse";
import GeminiIcon from "../../assets/images/gemini-color.svg";
import OpenAiIcon from "../../assets/images/openai.svg";
import PerplexityIcon from "../../assets/images/perplexity-color.svg";

const { height } = Dimensions.get("window");

type Message = {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: Date;
  options?: string[];
  kind?: "question" | "status" | "report-loading" | "report";
  questionMeta?: {
    index: number;
    total: number;
  };
  reportData?: FinalReportResponse;
};

const DEFAULT_PROVIDER_SETTINGS: AIProviderSettings = {
  chatgpt: true,
  gemini: true,
  perplexity: true,
};

function AnimatedDots() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = (index: number) => {
    const bright = 1;
    const dim = 0.18;
    const ranges: Record<number, number[]> = {
      0: [bright, dim, dim, dim, dim, bright],
      1: [dim, bright, dim, dim, dim, dim],
      2: [dim, dim, bright, dim, dim, dim],
      3: [dim, dim, dim, bright, dim, dim],
      4: [dim, dim, dim, dim, bright, dim],
    };
    return anim.interpolate({
      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
      outputRange: ranges[index] ?? ranges[0],
    });
  };

  const translateY = (index: number) => {
    const peak = -2;
    const rest = 0;
    const ranges: Record<number, number[]> = {
      0: [peak, rest, rest, rest, rest, peak],
      1: [rest, peak, rest, rest, rest, rest],
      2: [rest, rest, peak, rest, rest, rest],
      3: [rest, rest, rest, peak, rest, rest],
      4: [rest, rest, rest, rest, peak, rest],
    };
    return anim.interpolate({
      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
      outputRange: ranges[index] ?? ranges[0],
    });
  };

  const scale = (index: number) => {
    const peak = 1.65;
    const rest = 1;
    const ranges: Record<number, number[]> = {
      0: [peak, rest, rest, rest, rest, peak],
      1: [rest, peak, rest, rest, rest, rest],
      2: [rest, rest, peak, rest, rest, rest],
      3: [rest, rest, rest, peak, rest, rest],
      4: [rest, rest, rest, rest, peak, rest],
    };
    return anim.interpolate({
      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
      outputRange: ranges[index] ?? ranges[0],
    });
  };

  return (
    <>
      {[0, 1, 2, 3, 4].map((index) => (
        <Animated.View
          key={`adot-${index}`}
          style={[
            animDotStyles.dot,
            {
              opacity: opacity(index),
              transform: [
                { translateY: translateY(index) },
                { scale: scale(index) },
              ],
            },
          ]}
        />
      ))}
    </>
  );
}

const animDotStyles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#999999",
    marginHorizontal: 3,
  },
});

type ModelKey = "GPT" | "Gemini" | "Perplexity";
const ALL_MODELS: ModelKey[] = ["GPT", "Gemini", "Perplexity"];

const REPORT_CREATING_MESSAGE =
  "리포트를 생성하고 있어요. 잠시만 기다려 주세요.";

type RawCurationPayload = Partial<CurationResponse> & {
  data?: unknown;
  result?: unknown;
};

function extractPayload(payload: RawCurationPayload | unknown) {
  if (payload && typeof payload === "object") {
    const record = payload as RawCurationPayload;
    return (record.data ?? record.result ?? payload) as Record<string, unknown>;
  }
  return undefined;
}

function unwrapApiResponse<T>(raw: ApiResponse<T> | unknown) {
  if (raw && typeof raw === "object") {
    const record = raw as ApiResponse<T> & { result?: T };
    if (record.data !== undefined) return record.data;
    if (record.result !== undefined) return record.result;
  }
  return null;
}

function normalizeQuestion(raw: unknown): CategoryQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const questionText =
    (record.question_text as string | undefined) ??
    (record.questionText as string | undefined) ??
    (record.question as string | undefined) ??
    (record.text as string | undefined);
  if (!questionText) return null;

  const options =
    (Array.isArray(record.options) && (record.options as string[])) ||
    (Array.isArray(record.optionList) && (record.optionList as string[])) ||
    (Array.isArray(record.option_list) && (record.option_list as string[])) ||
    [];

  return {
    attribute_key:
      (record.attribute_key as string | undefined) ??
      (record.attributeKey as string | undefined) ??
      (record.attribute as string | undefined) ??
      "",
    display_label:
      (record.display_label as string | undefined) ??
      (record.displayLabel as string | undefined) ??
      (record.display_name as string | undefined) ??
      (record.displayName as string | undefined) ??
      "",
    question_text: questionText,
    options,
    user_answer:
      (record.user_answer as string | null | undefined) ??
      (record.userAnswer as string | null | undefined) ??
      null,
  };
}

function normalizeCurationResponse(
  raw: RawCurationPayload | unknown,
): CurationResponse | null {
  const payload = extractPayload(raw);
  if (!payload) return null;

  const rawQuestions =
    (payload.questions as unknown) ??
    (payload.curationQuestions as unknown) ??
    (payload.questionList as unknown) ??
    (payload.question_list as unknown) ??
    [];
  const questions = Array.isArray(rawQuestions)
    ? rawQuestions.map(normalizeQuestion).filter(Boolean)
    : [];

  const queryId =
    (payload.queryId as number | undefined) ??
    (payload.query_id as number | undefined) ??
    (payload.queryID as number | undefined);
  const categoryName =
    (payload.categoryName as string | undefined) ??
    (payload.category_name as string | undefined) ??
    (payload.category as string | undefined);
  const message =
    (payload.message as string | undefined) ??
    (payload.curationMessage as string | undefined) ??
    (payload.resultMessage as string | undefined) ??
    "";

  if (queryId == null || !categoryName) return null;

  return {
    queryId,
    categoryName,
    questions: questions as CategoryQuestion[],
    message,
  };
}

type RawFinalReportPayload = Record<string, unknown>;

type FetchReportResult = {
  report: FinalReportResponse;
  aiResponses: Record<string, AiRecommendationResponse | null>;
};

function normalizeTopProduct(value: unknown): TopProduct | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  const rankRaw = record.rank ?? record.order ?? record.priority;
  const rank =
    typeof rankRaw === "number"
      ? rankRaw
      : typeof rankRaw === "string"
        ? Number(rankRaw)
        : 0;

  const specsRaw =
    (record.specs as unknown) ??
    (record.specifications as unknown) ??
    (record.spec_map as unknown) ??
    (record.specs_map as unknown);

  const specs =
    specsRaw && typeof specsRaw === "object" && !Array.isArray(specsRaw)
      ? (specsRaw as Record<string, string>)
      : ({} as Record<string, string>);

  return {
    rank: Number.isFinite(rank) ? rank : 0,
    productName:
      (record.productName as string | undefined) ??
      (record.product_name as string | undefined) ??
      (record.name as string | undefined) ??
      "",
    productCode:
      (record.productCode as string | undefined) ??
      (record.product_code as string | undefined) ??
      (record.code as string | undefined) ??
      "",
    price: (record.price as string | undefined) ?? "",
    productImage:
      (record.productImage as string | undefined) ??
      (record.product_image as string | undefined) ??
      (record.image as string | undefined) ??
      "",
    specs,
    lowestPriceLink:
      (record.lowestPriceLink as string | undefined) ??
      (record.lowest_price_link as string | undefined) ??
      (record.lowestPriceUrl as string | undefined) ??
      (record.lowest_price_url as string | undefined) ??
      (record.link as string | undefined) ??
      "",
    comparativeAnalysis:
      (record.comparativeAnalysis as string | undefined) ??
      (record.comparative_analysis as string | undefined) ??
      (record.analysis as string | undefined) ??
      "",
  };
}

function normalizeFinalReportResponse(
  raw: RawFinalReportPayload | unknown,
): FinalReportResponse | null {
  const payload = extractPayload(raw);
  if (!payload) return null;

  // Some APIs return { finalReport, individualReports } shape.
  const finalReportSource =
    payload.finalReport && typeof payload.finalReport === "object"
      ? (payload.finalReport as Record<string, unknown>)
      : payload;

  const topProductsRaw =
    (finalReportSource.topProducts as unknown) ??
    (finalReportSource.top_products as unknown) ??
    (finalReportSource.products as unknown) ??
    [];
  const topProducts = Array.isArray(topProductsRaw)
    ? topProductsRaw.map(normalizeTopProduct).filter(Boolean)
    : [];

  const consensus =
    (finalReportSource.consensus as string | undefined) ??
    (finalReportSource.aiConsensus as string | undefined) ??
    (finalReportSource.ai_consensus as string | undefined) ??
    "";
  const decisionBranches =
    (finalReportSource.decisionBranches as string | undefined) ??
    (finalReportSource.decision_branches as string | undefined) ??
    (finalReportSource.modelDecisionBranches as string | undefined) ??
    "";
  const aiqRecommendationReason =
    (finalReportSource.aiqRecommendationReason as string | undefined) ??
    (finalReportSource.aiq_recommendation_reason as string | undefined) ??
    (finalReportSource.recommendationReason as string | undefined) ??
    "";
  const finalWord =
    (finalReportSource.finalWord as string | undefined) ??
    (finalReportSource.final_word as string | undefined) ??
    "";

  if (
    !consensus &&
    !decisionBranches &&
    !aiqRecommendationReason &&
    topProducts.length === 0 &&
    !finalWord
  ) {
    return null;
  }

  return {
    consensus,
    decisionBranches,
    aiqRecommendationReason,
    topProducts: topProducts as TopProduct[],
    finalWord,
  };
}

function mapModelKey(value: string): ModelKey | null {
  const normalized = value.toLowerCase();
  if (normalized.includes("gpt") || normalized.includes("chatgpt")) {
    return "GPT";
  }
  if (normalized.includes("gemini")) {
    return "Gemini";
  }
  if (normalized.includes("perplexity")) {
    return "Perplexity";
  }
  return null;
}

function normalizeAiRecommendation(
  raw: unknown,
): AiRecommendationResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;

  const recommendationsRaw =
    (record.recommendations as unknown) ??
    (record.products as unknown) ??
    (record.topProducts as unknown) ??
    [];

  const recommendations = Array.isArray(recommendationsRaw)
    ? recommendationsRaw
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const rec = item as Record<string, unknown>;
          const selectionReasonsRaw =
            (rec.selectionReasons as unknown) ??
            (rec.selection_reasons as unknown) ??
            (rec.reasons as unknown) ??
            [];
          const selectionReasons = Array.isArray(selectionReasonsRaw)
            ? selectionReasonsRaw.filter(
                (reason): reason is string => typeof reason === "string",
              )
            : [];

          return {
            productName:
              (rec.productName as string | undefined) ??
              (rec.product_name as string | undefined) ??
              (rec.name as string | undefined) ??
              "",
            productCode:
              (rec.productCode as string | undefined) ??
              (rec.product_code as string | undefined) ??
              (rec.code as string | undefined) ??
              "",
            targetAudience:
              (rec.targetAudience as string | undefined) ??
              (rec.target_audience as string | undefined) ??
              "",
            selectionReasons,
          };
        })
        .filter(
          (
            recommendation,
          ): recommendation is {
            productName: string;
            productCode: string;
            targetAudience: string;
            selectionReasons: string[];
          } => recommendation !== null,
        )
    : [];

  return {
    modelName:
      (record.modelName as string | undefined) ??
      (record.model_name as string | undefined) ??
      (record.provider as string | undefined) ??
      "",
    recommendations,
    specGuide:
      (record.specGuide as string | undefined) ??
      (record.spec_guide as string | undefined) ??
      (record.summary as string | undefined) ??
      "",
    finalWord:
      (record.finalWord as string | undefined) ??
      (record.final_word as string | undefined) ??
      "",
  };
}

function extractAiResponses(raw: unknown) {
  const payload = extractPayload(raw);
  if (!payload) return {};

  const reportsRaw =
    (payload.individualReports as unknown) ??
    (payload.individual_reports as unknown) ??
    [];
  if (!Array.isArray(reportsRaw)) return {};

  const mapped: Record<string, AiRecommendationResponse | null> = {};

  reportsRaw.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;

    let normalized = normalizeAiRecommendation(record);

    // Some backends wrap model payload as JSON string in `content`.
    if (
      (!normalized?.specGuide || normalized.recommendations.length === 0) &&
      typeof record.content === "string"
    ) {
      try {
        const parsedContent = JSON.parse(record.content) as unknown;
        normalized = normalizeAiRecommendation(parsedContent) ?? normalized;
      } catch {
        // Ignore malformed content JSON.
      }
    }

    const modelName =
      normalized?.modelName ||
      (record.modelName as string | undefined) ||
      (record.model_name as string | undefined) ||
      (record.provider as string | undefined) ||
      (record.modelId as string | undefined) ||
      (record.model_id as string | undefined) ||
      "";

    const modelKey = mapModelKey(modelName);
    if (!modelKey || !normalized) return;
    mapped[modelKey] = normalized;
  });

  return mapped;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    continue?: string;
    provider?: string;
  }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [curationData, setCurationData] = useState<CurationResponse | null>(
    null,
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [isAwaitingConsent, setIsAwaitingConsent] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<
    CategoryQuestion[] | null
  >(null);
  const [pendingQueryId, setPendingQueryId] = useState<number | null>(null);
  const [activeReportQueryId, setActiveReportQueryId] = useState<number | null>(
    null,
  );
  const [isReportGenerating, setIsReportGenerating] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<
    Record<string, "pending" | "complete" | "error">
  >({});
  const [aiResponses, setAiResponses] = useState<
    Record<string, AiRecommendationResponse | null>
  >({});
  const [failedProductImages, setFailedProductImages] = useState<
    Record<string, boolean>
  >({});
  const [showTop3, setShowTop3] = useState(false);
  const [activeReport, setActiveReport] = useState<FinalReportResponse | null>(
    null,
  );
  const [openProvider, setOpenProvider] = useState<ModelKey | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credits, setCreditsState] = useState(20);
  const [history, setHistory] = useState<HistoryResponseItem[]>([]);
  const [providerSettings, setProviderSettings] = useState<AIProviderSettings>(
    DEFAULT_PROVIDER_SETTINGS,
  );
  const [listHeight, setListHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [inputAreaHeight, setInputAreaHeight] = useState(0);
  const [reportActionHeight, setReportActionHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showTop3Info, setShowTop3Info] = useState(false);
  const [isHistoryReport, setIsHistoryReport] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isAtBottomRef = useRef(true);
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;
  const sseRef = useRef<any>(null);
  const suppressAutoScrollRef = useRef(false);

  const syncCredits = async (value: number) => {
    setCreditsState(value);
    await setCredits(value);
  };

  const syncCurrentUserSnapshot = useCallback(async () => {
    try {
      const response = await apiRequest<any>(API_ENDPOINTS.PROFILE_UPDATE, {
        method: "GET",
        requireAuth: true,
      });
      const snapshot = parseUserSnapshot(response);
      const nextNickname = snapshot.nickname ?? "";
      const nextEmail = snapshot.email ?? "";
      const nextCredits = snapshot.credits;

      if (nextNickname || nextEmail) {
        const nextProfile: UserProfile = {
          nickname: nextNickname,
          email: nextEmail,
        };
        setProfile(nextProfile);
        await updateUserProfile(nextProfile);
      }

      if (typeof nextCredits === "number" && Number.isFinite(nextCredits)) {
        await syncCredits(nextCredits);
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const response = await apiRequest<ApiResponse<HistoryResponseItem[]>>(
        API_ENDPOINTS.CURATION_HISTORY,
        {
          method: "GET",
          requireAuth: true,
        },
      );
      const data = unwrapApiResponse<HistoryResponseItem[]>(response);
      if (Array.isArray(data)) {
        setHistory(data);
        return data;
      }
    } catch {
      // Ignore history refresh errors and fall back to local session history.
    }

    try {
      const localHistory = await getChatHistory();
      const fallbackHistory = localHistory.map((item) => ({
        queryId: Number(item.id) || Date.now(),
        question: item.title,
        createdAt: item.createdAt,
      }));
      setHistory(fallbackHistory);
      return fallbackHistory;
    } catch {
      return null;
    }
  }, []);

  const fetchReportByQueryId = useCallback(async (queryId: number) => {
    const candidates = [`${API_ENDPOINTS.CURATION_HISTORY}/${queryId}/report`];

    for (const url of candidates) {
      try {
        const response = await apiRequest<ApiResponse<unknown>>(url, {
          method: "GET",
          requireAuth: true,
        });
        const raw = unwrapApiResponse<unknown>(response) ?? response;
        const report = normalizeFinalReportResponse(raw);
        if (report) {
          return {
            report,
            aiResponses: extractAiResponses(raw),
          } satisfies FetchReportResult;
        }
        console.warn("[fetchReportByQueryId] response could not normalize", {
          url,
          response,
        });
      } catch (error) {
        if (isApiError(error)) {
          if (error.status === 404 || error.status === 500) {
            continue;
          }
          console.warn("[fetchReportByQueryId] api error", {
            url,
            status: error.status,
            message: error.message,
            payload: error.payload,
          });
        } else {
          console.error("[fetchReportByQueryId] unexpected error", {
            url,
            error,
          });
        }
        throw error;
      }
    }
    return null;
  }, []);

  const loadUserData = useCallback(async () => {
    const [storedProfile, nextCredits, nextSettings] = await Promise.all([
      getUserProfile(),
      getCredits(),
      getAIProviderSettings(),
    ]);

    setProfile(storedProfile);
    setCreditsState(nextCredits);
    setProviderSettings(nextSettings);
    await refreshHistory();
    await syncCurrentUserSnapshot();
  }, [refreshHistory, syncCurrentUserSnapshot]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData]),
  );

  useEffect(() => {
    if (!isMenuOpen) return;
    loadUserData();
  }, [isMenuOpen, loadUserData]);

  useEffect(() => {
    const glowLoop = Animated.loop(
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
    );

    dotAnim.setValue(0);
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const floatLoop = Animated.loop(
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
    );

    const bounceLoop = Animated.loop(
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
    );

    glowLoop.start();
    dotLoop.start();
    floatLoop.start();
    bounceLoop.start();

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(
      showEvent,
      (event: KeyboardEvent) => {
        setIsKeyboardVisible(true);
        const height = event.endCoordinates?.height ?? 0;
        setKeyboardHeight(height);
        if (isAtBottomRef.current) {
          setTimeout(scrollToBottom, 50);
        }
      },
    );
    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
      glowLoop.stop();
      dotLoop.stop();
      floatLoop.stop();
      bounceLoop.stop();
    };
  }, [bounceAnim, dotAnim, floatAnim, glowAnim]);

  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close?.();
        sseRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (params.continue !== "true") return;

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
              : "선택된 리포트";

      setMessages([
        {
          id: `${Date.now()}-continue-0`,
          type: "ai",
          text: `${providerLabel} 기반 리포트를 바탕으로 이어서 질문을 이어갈게요.`,
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

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [params.continue, params.provider]);

  useEffect(() => {
    if (activeReport || isReportGenerating) {
      setInputAreaHeight(0);
    }
  }, [activeReport, isReportGenerating]);

  const appendMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const scrollToLatestReport = (animated = true) => {
    const reportIndex = [...messages]
      .map((message, index) => ({ message, index }))
      .filter(({ message }) => message.kind === "report")
      .map(({ index }) => index)
      .pop();

    if (typeof reportIndex !== "number") return;

    setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({
          index: reportIndex,
          viewPosition: 0,
          animated,
        });
      } catch {
        // Ignore scrollToIndex errors (e.g., not measured yet).
      }
    }, 50);
  };

  const handleContentSizeChange = (_: number, height: number) => {
    setContentHeight(height);
    if (suppressAutoScrollRef.current) {
      suppressAutoScrollRef.current = false;
      return;
    }
    if (listHeight > 0 && height > listHeight && isAtBottom) {
      if (activeReport) return;
      scrollToBottom();
    }
  };

  const handleScroll = (event: {
    nativeEvent: {
      layoutMeasurement: { height: number };
      contentOffset: { y: number };
      contentSize: { height: number };
    };
  }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 24;
    const atBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
  };

  const resetConversation = () => {
    setMessages([]);
    setInputText("");
    setCurationData(null);
    setCurrentQuestionIndex(0);
    setInitialQuestion("");
    setIsAwaitingConsent(false);
    setPendingQuestions(null);
    setPendingQueryId(null);
    setActiveReportQueryId(null);
    setIsReportGenerating(false);
    setOpenProvider(null);
    setAnalysisStatus({});
    setAiResponses({});
    setShowTop3(false);
    setActiveReport(null);
    setIsHistoryReport(false);
    if (sseRef.current) {
      sseRef.current.close?.();
      sseRef.current = null;
    }
  };

  const appendReportMessage = (report: FinalReportResponse) => {
    setShowTop3(false);
    setOpenProvider(null);
    setFailedProductImages({});
    setActiveReport(report);
    suppressAutoScrollRef.current = true;
    setMessages((prev) => {
      const next = prev.filter((message) => message.kind !== "report-loading");
      next.push({
        id: `${Date.now()}-report`,
        type: "ai",
        text: "",
        timestamp: new Date(),
        kind: "report",
        reportData: report,
      });
      requestAnimationFrame(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: next.length - 1,
            viewPosition: 0,
            animated: true,
          });
        } catch {
          // Ignore scrollToIndex errors (e.g., not measured yet).
        }
      });
      return next;
    });
  };

  const getNextPendingQuestionIndex = (questions: CategoryQuestion[]) =>
    questions.findIndex((question) => !question.user_answer);

  const formatParagraph = (value?: string) => {
    if (!value) return "";
    return value.replace(/\s*\/\s*/g, "\n");
  };

  const renderParagraphs = (value?: string) => {
    const formatted = formatParagraph(value);
    if (!formatted) return null;
    return formatted.split("\n").map((line, index) => (
      <Text key={`para-${index}`} style={styles.reportSummaryText}>
        {line.trim()}
      </Text>
    ));
  };

  const renderProviderParagraphs = (value?: string, keyPrefix = "provider") => {
    const formatted = formatParagraph(value);
    if (!formatted) return null;
    return formatted.split("\n").map((line, index) => (
      <Text
        key={`${keyPrefix}-para-${index}`}
        style={styles.providerDetailText}
      >
        {line.trim()}
      </Text>
    ));
  };

  const isModelEnabled = (
    model: ModelKey,
    settings: AIProviderSettings = providerSettings,
  ) => {
    if (model === "GPT") return settings.chatgpt;
    if (model === "Gemini") return settings.gemini;
    return settings.perplexity;
  };

  const getVisibleModels = (
    settings: AIProviderSettings = providerSettings,
  ): ModelKey[] =>
    ALL_MODELS.filter((model) => isModelEnabled(model, settings));

  const getSelectedModels = (): ModelKey[] => {
    const models = getVisibleModels();
    return models.length > 0 ? models : ALL_MODELS;
  };

  const initializeAnalysisStatus = (models: ModelKey[]) => {
    const nextStatus: Record<string, "pending" | "complete" | "error"> = {};
    models.forEach((model) => {
      nextStatus[model] = "pending";
    });
    setAnalysisStatus(nextStatus);
    setAiResponses({});
  };

  const handleModelAnswer = (model: ModelKey, payload: string) => {
    try {
      const data = JSON.parse(payload) as AiRecommendationResponse;
      setAiResponses((prev) => ({ ...prev, [model]: data }));
    } catch {
      // Ignore parse errors for model payloads.
    }
    setAnalysisStatus((prev) => ({ ...prev, [model]: "complete" }));
  };

  const handleFinalReport = (payload: string) => {
    try {
      const parsed = JSON.parse(payload) as unknown;
      const report = normalizeFinalReportResponse(parsed);
      if (!report) {
        throw new Error("Invalid report payload");
      }
      setAnalysisStatus((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          next[key] = "complete";
        });
        return next;
      });
      appendReportMessage(report);
      setIsReportGenerating(false);
      setPendingQuestions(null);
      setPendingQueryId(null);
      setIsHistoryReport(false);
      refreshHistory();
    } catch {
      Alert.alert("오류", "리포트를 표시하는 중 문제가 발생했습니다.");
      setIsReportGenerating(false);
    }
  };

  const pollForReport = async (queryId: number) => {
    const maxAttempts = 30;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const result = await fetchReportByQueryId(queryId);
        if (result) {
          appendReportMessage(result.report);
          setAiResponses(result.aiResponses);
          setIsReportGenerating(false);
          setPendingQuestions(null);
          setPendingQueryId(null);
          setIsHistoryReport(false);
          refreshHistory();
          return;
        }
      } catch {
        // Continue polling until report is ready.
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    Alert.alert("오류", "리포트 생성 시간이 초과되었습니다.");
    setIsReportGenerating(false);
  };

  const startReportStreaming = async (queryId: number) => {
    const models = getSelectedModels();
    initializeAnalysisStatus(models);

    const modelParam = encodeURIComponent(models.join(","));
    const streamUrl = `${API_ENDPOINTS.AIQ_STREAM}/${queryId}?models=${modelParam}`;

    const accessToken = await getAccessToken();
    const EventSourceImpl = (globalThis as any).EventSource ?? EventSource;

    if (!EventSourceImpl) {
      await pollForReport(queryId);
      return;
    }

    const eventSource = new EventSourceImpl(streamUrl, {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    });

    sseRef.current = eventSource;

    eventSource.addEventListener("GPT_ANSWER", (event: { data: string }) => {
      handleModelAnswer("GPT", event.data);
    });
    eventSource.addEventListener("Gemini_ANSWER", (event: { data: string }) => {
      handleModelAnswer("Gemini", event.data);
    });
    eventSource.addEventListener(
      "Perplexity_ANSWER",
      (event: { data: string }) => {
        handleModelAnswer("Perplexity", event.data);
      },
    );
    eventSource.addEventListener("FINAL_REPORT", (event: { data: string }) => {
      handleFinalReport(event.data);
    });
    eventSource.addEventListener("ERROR", (event: { data?: string }) => {
      setIsReportGenerating(false);
      Alert.alert("오류", event?.data || "스트리밍 중 오류가 발생했습니다.");
      eventSource.close();
    });
    eventSource.addEventListener("finish", () => {
      eventSource.close();
      sseRef.current = null;
    });
  };

  const requestReportConsent = (questions: CategoryQuestion[]) => {
    setIsAwaitingConsent(true);
    setPendingQuestions(questions);
    setPendingQueryId(curationData?.queryId ?? pendingQueryId);
    setCurationData(null);
    setCurrentQuestionIndex(0);

    appendMessage({
      id: `${Date.now()}-consent`,
      type: "ai",
      text: "리포트를 생성할까요?\n*비동의시 메인화면으로 재이동됩니다.",
      timestamp: new Date(),
      options: ["동의", "비동의"],
      kind: "status",
    });
    scrollToBottom();
  };

  const handleReportConsent = async (answer: string) => {
    const normalizedAnswer = answer.trim();
    if (normalizedAnswer !== "동의" && normalizedAnswer !== "비동의") {
      Alert.alert("안내", "동의 또는 비동의를 선택해 주세요.");
      return;
    }

    setIsAwaitingConsent(false);
    const pending = pendingQuestions;
    setPendingQuestions(null);

    if (normalizedAnswer !== "동의") {
      appendMessage({
        id: `${Date.now()}-consent-cancel`,
        type: "ai",
        text: "리포트 생성을 취소했어요. 원하면 다시 질문해 주세요.",
        timestamp: new Date(),
        kind: "status",
      });
      scrollToBottom();
      return;
    }

    if (!pending || pending.length === 0) {
      Alert.alert("오류", "리포트 생성에 필요한 질문이 없습니다.");
      return;
    }

    if (!pendingQueryId) {
      Alert.alert("오류", "리포트 생성에 필요한 질문 ID가 없습니다.");
      return;
    }

    if (credits < 3) {
      Alert.alert("크레딧 부족", "리포트를 생성하려면 3크레딧이 필요합니다.");
      return;
    }

    setIsReportGenerating(true);
    setShowTop3(false);
    setActiveReportQueryId(pendingQueryId);
    if (sseRef.current) {
      sseRef.current.close?.();
      sseRef.current = null;
    }
    const nextCredits = await decrementCredits(3);
    await syncCredits(nextCredits);

    appendMessage({
      id: `${Date.now()}-report-loading`,
      type: "ai",
      text: REPORT_CREATING_MESSAGE,
      timestamp: new Date(),
      kind: "report-loading",
    });
    scrollToBottom();

    try {
      const answers = pending
        .filter((question) => question.user_answer)
        .map((question) => ({
          display_label: question.display_label || question.question_text,
          user_answer: question.user_answer ?? "",
        }));

      await apiRequest<ApiResponse<null>>(API_ENDPOINTS.CURATION_SUBMIT, {
        method: "POST",
        requireAuth: true,
        body: {
          queryId: pendingQueryId,
          answers,
        },
      });

      await startReportStreaming(pendingQueryId);
    } catch (error) {
      setIsReportGenerating(false);
      if (isApiError(error)) {
        Alert.alert("오류", error.message);
      } else {
        Alert.alert("오류", "리포트 생성 요청에 실패했습니다.");
      }
    }
  };

  const askNextQuestion = async (answer: string) => {
    if (!curationData) return;
    if (!Array.isArray(curationData.questions)) {
      Alert.alert("오류", "큐레이션 질문 목록이 비어 있습니다.");
      return;
    }

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
        kind: "question",
        questionMeta: {
          index: nextIndex + 1,
          total: updatedQuestions.length,
        },
      });
      scrollToBottom();
      return;
    }

    requestReportConsent(updatedQuestions);
  };

  const startCuration = async (questionText: string) => {
    setIsLoading(true);
    const previousCredits = credits;

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        Alert.alert("로그인 필요", "로그인이 필요합니다. 로그인해 주세요.");
        return;
      }

      const decoded = jwtDecode<{ userId: number }>(accessToken);
      const data = await apiRequest<ApiResponse<CurationResponse>>(
        API_ENDPOINTS.CURATION_START,
        {
          method: "POST",
          requireAuth: true,
          timeoutMs: 60000,
          body: {
            userId: decoded.userId,
            question: questionText,
          },
        },
      );
      const normalized = normalizeCurationResponse(data);
      if (!normalized || !Array.isArray(normalized.questions)) {
        await syncCredits(previousCredits);
        Alert.alert("오류", "큐레이션 응답이 비어 있습니다.");
        return;
      }

      setCurationData(normalized);
      setPendingQueryId(normalized.queryId);
      setCurrentQuestionIndex(0);
      setInitialQuestion(questionText);
      await refreshHistory();

      appendMessage({
        id: `${Date.now()}-category`,
        type: "ai",
        text:
          normalized.message ||
          `${normalized.categoryName} 카테고리로 정리했어요.`,
        timestamp: new Date(),
      });

      if (normalized.questions.length > 0) {
        appendMessage({
          id: `${Date.now()}-question`,
          type: "ai",
          text: normalized.questions[0].question_text,
          timestamp: new Date(),
          options: normalized.questions[0].options,
          kind: "question",
          questionMeta: {
            index: 1,
            total: normalized.questions.length,
          },
        });
      }

      scrollToBottom();
    } catch (error) {
      await syncCredits(previousCredits);
      if (isApiError(error)) {
        Alert.alert("오류", error.message);
      } else if (error instanceof Error && error.message) {
        Alert.alert(
          "오류",
          `응답 처리 중 문제가 발생했습니다: ${error.message}`,
        );
      } else {
        Alert.alert("오류", "서버와 연결할 수 없습니다.");
      }
      appendMessage({
        id: `${Date.now()}-error`,
        type: "ai",
        text: "일시적인 문제가 발생했어요. 다시 시도해 주세요.",
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

    if (isAwaitingConsent) {
      await handleReportConsent(questionText);
      return;
    }

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
    if (isAwaitingConsent) {
      await handleReportConsent(option);
      return;
    }
    await askNextQuestion(option);
  };

  const dismissKeyboard = () => {
    setIsInputFocused(false);
    Keyboard.dismiss();
  };

  const handleToggleProvider = async (
    key: keyof AIProviderSettings,
    value: boolean,
  ) => {
    const nextSettings = { ...providerSettings, [key]: value };
    setProviderSettings(nextSettings);
    if (openProvider && !isModelEnabled(openProvider, nextSettings)) {
      setOpenProvider(null);
    }
    await saveAIProviderSettings(nextSettings);
  };

  const handleCreditReward = async () => {
    const synced = await syncCurrentUserSnapshot();
    setCreditsOpen(false);
    if (synced) {
      Alert.alert(
        "크레딧 동기화",
        "서버의 최신 크레딧을 반영했습니다. 광고 보상은 AdMob 서버 콜백으로 지급됩니다.",
      );
      return;
    }

    Alert.alert(
      "동기화 실패",
      "서버와 통신할 수 없어 크레딧을 새로고침하지 못했습니다.",
    );
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await Promise.all([clearAuthTokens(), clearSessionData()]);
    router.replace("/(auth)/welcome");
  };

  const handleWithdraw = () => {
    Alert.alert(
      "회원탈퇴",
      "탈퇴하면 계정과 저장된 정보가 초기화됩니다. 계속하시겠어요?",
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

  const handleSelectHistory = async (item: HistoryResponseItem) => {
    setIsMenuOpen(false);
    try {
      const cachedReport = await getHistoryReport(item.queryId);
      const result = await fetchReportByQueryId(item.queryId);
      const report = cachedReport ?? result?.report ?? null;

      if (!report) {
        Alert.alert("안내", "리포트를 생성하지 않았습니다.");
        return;
      }

      setMessages([]);
      setCurationData(null);
      setIsAwaitingConsent(false);
      setPendingQuestions(null);
      setPendingQueryId(null);
      setIsReportGenerating(false);
      setAnalysisStatus({});
      setAiResponses(result?.aiResponses ?? {});
      setIsHistoryReport(true);
      // 히스토리 첫 질문 메시지 먼저 추가
      setMessages([
        {
          id: `${Date.now()}-history-q`,
          type: "user",
          text: item.question,
          timestamp: new Date(item.createdAt),
        },
      ]);
      appendReportMessage(report);
      setShowTop3((report.topProducts?.length ?? 0) > 1);
      scrollToBottom();
    } catch (error) {
      Alert.alert("안내", "리포트를 생성하지 않았습니다.");
    }
  };

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      // Ignore link open failures.
    }
  };

  const firstUserMessageId = messages.find(
    (message) => message.type === "user",
  )?.id;
  const firstAiMessageId = messages.find(
    (message) => message.type === "ai",
  )?.id;
  const glowRadius = glowAnim.interpolate({
    inputRange: [0.3, 0.6],
    outputRange: [10, 18],
  });

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.type === "user";
    const isFirstUserMessage = isUser && item.id === firstUserMessageId;
    const hasOptions = !isUser && item.options && item.options.length > 0;
    const showQuestionMeta = item.kind === "question" && item.questionMeta;
    const visibleModels = getVisibleModels();

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!isUser && item.id === firstAiMessageId ? (
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
              <Text style={styles.userAvatarIcon}>
                {(profile?.nickname || "U").slice(0, 1).toUpperCase()}
              </Text>
            </View>
          </View>
        ) : null}

        {item.kind === "report-loading" ? (
          <View
            style={[
              styles.messageBubble,
              styles.aiBubble,
              styles.reportLoadingBubble,
            ]}
          >
            <Text style={styles.reportLoadingTitle}>
              최적의 답변을 생성하고 있습니다
            </Text>
            <View style={[styles.loadingDots, styles.reportLoadingDots]}>
              <AnimatedDots />
            </View>
            <View style={styles.providerStatusList}>
              {visibleModels.map((model) => {
                const status = analysisStatus[model];
                const label =
                  model === "GPT"
                    ? "Chat GPT"
                    : model === "Gemini"
                      ? "Gemini"
                      : "Perplexity";
                const statusLabel =
                  status === "complete"
                    ? "분석 완료"
                    : status === "error"
                      ? "오류"
                      : "분석 중...";
                const statusTone =
                  status === "complete"
                    ? "complete"
                    : status === "error"
                      ? "error"
                      : "analyzing";
                return (
                  <View key={model} style={styles.providerStatusRow}>
                    <View style={styles.providerStatusLeft}>
                      <View
                        style={[
                          styles.providerStatusBullet,
                          statusTone === "analyzing"
                            ? styles.providerStatusBulletAnalyzing
                            : null,
                          statusTone === "error"
                            ? styles.providerStatusBulletError
                            : null,
                        ]}
                      />
                      <Text
                        style={[
                          styles.providerStatusLabel,
                          statusTone === "analyzing"
                            ? styles.providerStatusTextAnalyzing
                            : null,
                        ]}
                      >
                        {label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.providerStatusValue,
                        statusTone === "analyzing"
                          ? styles.providerStatusTextAnalyzing
                          : null,
                        statusTone === "error"
                          ? styles.providerStatusTextError
                          : null,
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : item.kind === "report" && item.reportData ? (
          <View style={styles.reportCard}>
            <Text style={styles.reportSectionTitle}>
              {showTop3 ? "추천 제품 TOP 3" : "추천 제품 TOP 1"}
            </Text>
            {item.reportData.topProducts &&
            item.reportData.topProducts.length > 0 ? (
              <View style={styles.topProductGroup}>
                {(showTop3
                  ? item.reportData.topProducts
                  : item.reportData.topProducts.slice(0, 1)
                )
                  .sort((a, b) => a.rank - b.rank)
                  .map((product) => {
                    const productImageKey = `${product.productCode}-${product.rank}`;
                    const imageUri = product.productImage?.trim();
                    const isImageFailed =
                      !!failedProductImages[productImageKey];
                    const showProductImage = !!imageUri && !isImageFailed;

                    return (
                      <View key={productImageKey} style={styles.topProductCard}>
                        <Text style={styles.topProductName}>
                          {product.productName}
                        </Text>
                        <Text style={styles.topProductPrice}>
                          {product.price}
                        </Text>
                        {showTop3 ? (
                          <Text style={styles.productRankLabel}>
                            추천제품 {product.rank}
                          </Text>
                        ) : null}
                        {showProductImage ? (
                          <Image
                            source={{ uri: imageUri }}
                            style={styles.productImage}
                            resizeMode="contain"
                            onError={() => {
                              setFailedProductImages((prev) => ({
                                ...prev,
                                [productImageKey]: true,
                              }));
                            }}
                          />
                        ) : (
                          <View style={styles.productImagePlaceholder}>
                            <Text style={styles.productImagePlaceholderText}>
                              {isImageFailed
                                ? "이미지를 불러올 수 없습니다"
                                : "이미지 없음"}
                            </Text>
                          </View>
                        )}
                        <View style={styles.specsRow}>
                          {Object.entries(product.specs || {}).map(
                            ([key, value]) => (
                              <View
                                key={`${product.productCode}-${key}`}
                                style={styles.specChip}
                              >
                                <Text style={styles.specChipText}>
                                  {key}: {value}
                                </Text>
                              </View>
                            ),
                          )}
                        </View>
                        <Text style={styles.topProductReason}>
                          {product.comparativeAnalysis}
                        </Text>
                        <TouchableOpacity
                          style={styles.buyButton}
                          onPress={() =>
                            handleLinkPress(product.lowestPriceLink)
                          }
                        >
                          <Text style={styles.buyButtonText}>구매하러가기</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
              </View>
            ) : (
              <Text style={styles.reportEmptyText}>
                추천 제품 정보를 불러올 수 없습니다.
              </Text>
            )}

            <Text style={styles.reportSectionTitle}>AIQ 통합 분석 리포트</Text>
            <View style={styles.reportSummaryContainer}>
              <View style={styles.reportSummarySection}>
                <Text style={styles.reportSummaryTitle}>AI 공통 핵심 합의</Text>
                <View style={styles.reportParagraphGroup}>
                  {renderParagraphs(item.reportData.consensus)}
                </View>
              </View>

              <View style={styles.reportSummaryDivider} />

              <View style={styles.reportSummarySection}>
                <Text style={styles.reportSummaryTitle}>
                  모델별 판단 근거 분석
                </Text>
                <View style={styles.reportParagraphGroup}>
                  {renderParagraphs(item.reportData.decisionBranches)}
                </View>
              </View>

              <View style={styles.reportSummaryDivider} />

              <View style={styles.reportSummarySection}>
                <Text style={styles.reportSummaryTitle}>AIQ 추천 이유</Text>
                <View style={styles.reportParagraphGroup}>
                  {renderParagraphs(item.reportData.aiqRecommendationReason)}
                </View>
              </View>
            </View>

            {visibleModels.length > 0 ? (
              <Text style={styles.reportSectionTitle}>AI 답변 보기</Text>
            ) : null}
            <View style={styles.providerToggleGroup}>
              {visibleModels.map((model) => {
                const isOpen = openProvider === model;
                const label = model === "GPT" ? "Chat GPT" : model;
                const response = aiResponses[model];
                if (!response) return null;
                const IconComponent =
                  model === "GPT"
                    ? OpenAiIcon
                    : model === "Gemini"
                      ? GeminiIcon
                      : PerplexityIcon;
                return (
                  <View key={model} style={styles.providerToggleCard}>
                    <TouchableOpacity
                      style={styles.providerToggleHeader}
                      onPress={() => setOpenProvider(isOpen ? null : model)}
                    >
                      <View style={styles.providerTitleRow}>
                        <View style={[styles.providerAvatar]}>
                          <IconComponent width={18} height={18} />
                        </View>
                        <Text style={styles.providerToggleTitle}>{label}</Text>
                      </View>
                      <Text style={styles.providerToggleAction}>
                        {isOpen ? "닫기" : "상세보기"}
                      </Text>
                    </TouchableOpacity>
                    {isOpen ? (
                      <View style={styles.providerToggleBody}>
                        {response?.specGuide ? (
                          renderProviderParagraphs(response.specGuide, model)
                        ) : (
                          <Text style={styles.providerDetailText}>
                            응답을 불러오지 못했습니다.
                          </Text>
                        )}
                        {response?.recommendations?.map((rec, index) => (
                          <Text
                            key={`${model}-rec-${index}`}
                            style={styles.providerDetailText}
                          >
                            - {rec.productName}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {showQuestionMeta ? (
              <Text
                style={[
                  styles.messageText,
                  isUser ? styles.userText : styles.aiText,
                ]}
              >
                {item.text}
                {"  "}
                <Text style={styles.questionBadgeInline}>
                  {item.questionMeta!.index}/{item.questionMeta!.total}
                </Text>
              </Text>
            ) : (
              <Text
                style={[
                  styles.messageText,
                  isUser ? styles.userText : styles.aiText,
                ]}
              >
                {item.text}
              </Text>
            )}
          </View>
        )}

        {hasOptions ? (
          <View style={styles.optionsContainer}>
            {item.options!.map((option) => (
              <TouchableOpacity
                key={`${item.id}-${option}`}
                style={styles.optionButton}
                onPress={() => handleOptionSelect(option)}
                activeOpacity={0.7}
                disabled={isLoading || isReportGenerating}
              >
                <Text style={styles.optionButtonText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const dotOpacity = (index: number) => {
    const dim = 0.2;
    const bright = 1;
    const outputRanges: Record<number, number[]> = {
      0: [bright, dim, dim, dim, dim, bright],
      1: [dim, bright, dim, dim, dim, dim],
      2: [dim, dim, bright, dim, dim, dim],
      3: [dim, dim, dim, bright, dim, dim],
      4: [dim, dim, dim, dim, bright, dim],
    };

    return dotAnim.interpolate({
      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
      outputRange: outputRanges[index] ?? outputRanges[0],
    });
  };

  const dotTranslateY = (index: number) => {
    const peak = -2;
    const rest = 0;
    const outputRanges: Record<number, number[]> = {
      0: [peak, rest, rest, rest, rest, peak],
      1: [rest, peak, rest, rest, rest, rest],
      2: [rest, rest, peak, rest, rest, rest],
      3: [rest, rest, rest, peak, rest, rest],
      4: [rest, rest, rest, rest, peak, rest],
    };

    return dotAnim.interpolate({
      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
      outputRange: outputRanges[index] ?? outputRanges[0],
    });
  };

  const dotScale = (index: number) => {
    const peak = 1.65;
    const rest = 1;
    const outputRanges: Record<number, number[]> = {
      0: [peak, rest, rest, rest, rest, peak],
      1: [rest, peak, rest, rest, rest, rest],
      2: [rest, rest, peak, rest, rest, rest],
      3: [rest, rest, rest, peak, rest, rest],
      4: [rest, rest, rest, rest, peak, rest],
    };

    return dotAnim.interpolate({
      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
      outputRange: outputRanges[index] ?? outputRanges[0],
    });
  };

  const renderLoading = () => (
    <View style={styles.messageContainer}>
      <View
        style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}
      >
        <Text style={styles.loadingText}>질문을 분석하고 있습니다</Text>
        <View style={styles.loadingDots}>
          {[0, 1, 2, 3, 4].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.loadingDot,
                styles.loadingDotAnalyzing,
                {
                  opacity: dotOpacity(index),
                  transform: [
                    { translateY: dotTranslateY(index) },
                    { scale: dotScale(index) },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );

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
        <Text style={styles.characterSubtitle}>
          만나서 반가워! 난 피클이야.
        </Text>
        <Text style={styles.characterSubtitle}>
          필요한 제품 조건만 말해주면 질문을 이어갈게.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <StarfieldBackground density={0.0002} maxOpacity={0.8} />
        <View style={styles.pressableContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={resetConversation}>
              <Image
                source={require("../../assets/images/onboarding-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setIsMenuOpen(true)}
            >
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
          </View>

          {messages.length > 0 ? (
            <>
              <View
                style={styles.chatBorderContainer}
                onTouchStart={dismissKeyboard}
              >
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={[
                    styles.messagesList,
                    {
                      paddingBottom:
                        Math.max(
                          24,
                          (activeReport && !isHistoryReport
                            ? reportActionHeight
                            : inputAreaHeight) + 24,
                        ) +
                        keyboardHeight +
                        (isReportGenerating ? 36 : 0),
                    },
                  ]}
                  contentInset={{ bottom: keyboardHeight }}
                  contentOffset={{ x: 0, y: 0 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  onScroll={handleScroll}
                  onScrollBeginDrag={dismissKeyboard}
                  scrollEventThrottle={16}
                  onScrollToIndexFailed={(info) => {
                    const fallbackOffset = info.averageItemLength * info.index;
                    setTimeout(() => {
                      flatListRef.current?.scrollToOffset({
                        offset: fallbackOffset,
                        animated: true,
                      });
                    }, 50);
                  }}
                  onLayout={(event) =>
                    setListHeight(event.nativeEvent.layout.height)
                  }
                  onContentSizeChange={handleContentSizeChange}
                  ListFooterComponent={
                    <View>
                      {isLoading ? renderLoading() : null}
                      <View style={styles.listSpacer} />
                    </View>
                  }
                />
              </View>

              {activeReport && !isHistoryReport ? (
                <View
                  style={[
                    styles.reportActionArea,
                    {
                      marginBottom: Math.max(12, insets.bottom + 6),
                    },
                  ]}
                  onLayout={(event) =>
                    setReportActionHeight(event.nativeEvent.layout.height)
                  }
                >
                  {!showTop3 && activeReport?.topProducts?.length > 1 ? (
                    <TouchableOpacity
                      style={[
                        styles.reportActionButton,
                        styles.top3ActionButton,
                      ]}
                      onPress={() => {
                        setShowTop3(true);
                        scrollToLatestReport(true);
                        refreshHistory();
                      }}
                      activeOpacity={0.9}
                    >
                      <View style={styles.top3ActionLabel}>
                        <Text
                          style={[
                            styles.reportActionText,
                            styles.top3ActionText,
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          TOP3까지 확인하기
                        </Text>
                      </View>
                      <Pressable
                        style={styles.top3InfoButton}
                        hitSlop={10}
                        onPress={(event) => {
                          event.stopPropagation?.();
                          setShowTop3Info(true);
                        }}
                      >
                        <Text style={styles.top3InfoButtonText}>?</Text>
                      </Pressable>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={styles.reportActionButton}
                    onPress={async () => {
                      if (activeReportQueryId && activeReport) {
                        const historySnapshot: FinalReportResponse = {
                          ...activeReport,
                          topProducts: showTop3
                            ? activeReport.topProducts
                            : activeReport.topProducts.slice(0, 1),
                        };
                        await saveHistoryReport(
                          activeReportQueryId,
                          historySnapshot,
                        );
                      }

                      const first = await refreshHistory();
                      await new Promise((resolve) => setTimeout(resolve, 350));
                      const second = await refreshHistory();
                      const nextHistory = second ?? first ?? [];
                      const isSaved = activeReportQueryId
                        ? nextHistory.some(
                            (item) => item.queryId === activeReportQueryId,
                          )
                        : nextHistory.length > 0;

                      if (isSaved) {
                        Alert.alert(
                          "완료",
                          "리포트를 히스토리에 저장했습니다.",
                        );
                      } else {
                        Alert.alert(
                          "안내",
                          "히스토리에 아직 반영되지 않았어요. 잠시 후 메뉴에서 다시 확인해 주세요.",
                        );
                      }
                      resetConversation();
                    }}
                  >
                    <Text style={styles.reportActionText}>완료하기</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          ) : (
            <Pressable style={styles.emptyWrapper} onPress={dismissKeyboard}>
              {renderEmpty()}
            </Pressable>
          )}

          {messages.length === 0 && !isKeyboardVisible && !isInputFocused ? (
            <Animated.View
              style={[
                styles.tooltipContainer,
                { transform: [{ translateY: bounceAnim }] },
              ]}
            >
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>
                  검색에 필요한 제품을 입력해줘
                </Text>
              </View>
              <View style={styles.tooltipArrow} />
            </Animated.View>
          ) : null}

          {/* TOP3 정보 모달 */}
          <Modal
            animationType="fade"
            transparent
            visible={showTop3Info}
            onRequestClose={() => setShowTop3Info(false)}
          >
            <View style={styles.top3ModalOverlay}>
              <View style={styles.top3ModalContent}>
                <Text style={styles.top3ModalTitle}>TOP3까지 확인하기</Text>
                <Text style={styles.top3ModalSubtitle}>
                  하나만 보기엔 아쉬우셨나요? 이제 TOP3까지 한눈에!
                </Text>

                <View style={styles.top3ModalImagePlaceholder}>
                  <Image
                    source={require("@/assets/images/top3.png")}
                    style={styles.top3ModalImage}
                    defaultSource={require("@/assets/images/top3.png")}
                  />
                </View>

                <Text style={styles.top3ModalBody}>
                  최고점 제품부터 차순위 아이템까지, 여러 AI 모델이 엄선한 상위
                  3개 제품을 지금 바로 확인해 보세요.
                </Text>

                <TouchableOpacity
                  style={styles.top3ModalClose}
                  onPress={() => setShowTop3Info(false)}
                >
                  <Text style={styles.top3ModalCloseText}>닫기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {!activeReport && !isReportGenerating ? (
            <View
              style={[
                styles.inputContainer,
                {
                  paddingBottom: isKeyboardVisible
                    ? 2
                    : Math.max(22, insets.bottom + 10),
                },
              ]}
              onLayout={(event) =>
                setInputAreaHeight(event.nativeEvent.layout.height)
              }
            >
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={"무엇이든 물어보세요"}
                  placeholderTextColor={AppColors.gray}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleSend}
                  onFocus={() => {
                    setIsInputFocused(true);
                    if (isAtBottomRef.current) {
                      setTimeout(scrollToBottom, 50);
                    }
                  }}
                  onBlur={() => setIsInputFocused(false)}
                  multiline
                  maxLength={500}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSend}
                  disabled={!inputText.trim() || isLoading}
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
          ) : null}
        </View>
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
        onSelectHistory={handleSelectHistory}
      />

      <LegalModal
        description={HELP_FAQ}
        open={helpOpen}
        title="도움말"
        onClose={() => setHelpOpen(false)}
      />

      <Modal
        animationType="fade"
        transparent
        visible={creditsOpen}
        onRequestClose={() => setCreditsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>광고로 크레딧 충전</Text>
            <Text style={styles.creditNumber}>{credits} credits</Text>
            <Text style={styles.modalBody}>
              * 리포트 생성 시 3 크레딧이 차감됩니다.{"\n"}광고 보기 버튼으로 2
              크레딧을 적립할 수 있습니다.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCreditReward}
            >
              <Text style={styles.modalButtonText}>광고 보고 2C 받기</Text>
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
    alignItems: "center",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: 940,
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
    width: "100%",
    maxWidth: 940,
    marginBottom: 8,
    borderWidth: 0.4,
    borderColor: AppColors.primaryGreen,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.18)",
  },
  emptyWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 940,
  },
  messagesList: {
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 18,
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
    marginVertical: 6,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  aiMessageContainer: {
    alignItems: "flex-start",
  },
  aiAvatarRow: {
    marginBottom: 6,
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
    maxWidth: "90%",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 24,
  },
  aiBubble: {
    backgroundColor: "rgba(0, 0, 0, 0.88)",
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
    borderTopLeftRadius: 6,
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  userBubble: {
    backgroundColor: AppColors.primaryGreen,
    borderTopRightRadius: 6,
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  messageText: {
    fontSize: 11,
    lineHeight: 18,
    flexShrink: 1,
    textAlign: "left",
    paddingBottom: 2,
  },
  userText: {
    color: AppColors.black,
    fontSize: 12,
    fontWeight: "700",
  },
  aiText: {
    color: AppColors.white,
    fontFamily: "Galmuri9",
  },
  loadingBubble: {
    alignSelf: "flex-start",
    marginTop: 6,
  },
  loadingText: {
    color: AppColors.white,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 14,
    alignSelf: "center",
    justifyContent: "center",
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primaryGreen,
  },
  loadingDotAnalyzing: {
    backgroundColor: AppColors.gray,
  },
  listSpacer: {
    height: 8,
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
    paddingHorizontal: 18,
    paddingVertical: 8,
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  tooltipText: {
    fontFamily: "Galmuri9",
    fontSize: 11,
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
    width: "100%",
    maxWidth: 940,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 26 : 16,
  },
  inputWrapper: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: AppColors.black,
    maxHeight: 64,
    paddingVertical: 10,
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
    gap: 6,
  },
  questionBadgeInline: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: "rgba(63, 221, 144, 0.18)",
    color: AppColors.primaryGreen,
    fontSize: 10,
    fontWeight: "800",
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.55)",
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  reportLoadingBubble: {
    maxWidth: "90%",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 24,
    borderTopLeftRadius: 6,
  },
  reportLoadingTitle: {
    color: AppColors.primaryGreen,
    fontFamily: "Galmuri9",
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: "left",
  },
  reportLoadingDots: {
    alignSelf: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  providerStatusList: {
    gap: 10,
    marginTop: 2,
  },
  providerStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  providerStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  providerStatusBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primaryGreen,
  },
  providerStatusBulletAnalyzing: {
    backgroundColor: AppColors.gray,
  },
  providerStatusBulletError: {
    backgroundColor: AppColors.error,
  },
  providerStatusLabel: {
    color: AppColors.primaryGreen,
    fontFamily: "Galmuri9",
    fontSize: 11,
    lineHeight: 18,
  },
  providerStatusValue: {
    color: "rgba(63, 221, 144, 0.7)",
    fontFamily: "Galmuri9",
    fontSize: 11,
    lineHeight: 18,
  },
  providerStatusTextAnalyzing: {
    color: AppColors.gray,
  },
  providerStatusTextError: {
    color: AppColors.error,
  },
  reportCard: {
    width: "100%",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 20,
    padding: 0,
    gap: 14,
  },
  reportSectionTitle: {
    color: AppColors.primaryGreen,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  topProductGroup: {
    gap: 18,
  },
  topProductCard: {
    backgroundColor: "rgba(0, 0, 0, 0.42)",
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.22)",
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  topProductName: {
    color: AppColors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  productRankLabel: {
    color: AppColors.primaryGreen,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  topProductPrice: {
    color: AppColors.primaryGreen,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  productImage: {
    width: "100%",
    height: 190,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  productImagePlaceholder: {
    width: "100%",
    height: 190,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  productImagePlaceholderText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
  },
  specsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  specChip: {
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.35)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  specChipText: {
    color: AppColors.white,
    fontSize: 11,
  },
  topProductReason: {
    color: AppColors.lightGray,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  buyButton: {
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  buyButtonText: {
    color: AppColors.primaryGreen,
    fontSize: 12,
    fontWeight: "700",
  },
  reportEmptyText: {
    color: AppColors.gray,
    fontSize: 12,
  },
  reportSummaryContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.42)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.22)",
    gap: 14,
  },
  reportSummarySection: {
    gap: 10,
  },
  reportSummaryDivider: {
    height: 1,
    backgroundColor: "rgba(63, 221, 144, 0.18)",
    marginVertical: 4,
  },
  reportParagraphGroup: {
    gap: 6,
  },
  reportSummaryTitle: {
    color: AppColors.primaryGreen,
    fontSize: 13,
    fontWeight: "700",
  },
  reportSummaryText: {
    color: AppColors.white,
    fontSize: 13,
    lineHeight: 20,
  },
  providerToggleGroup: {
    gap: 10,
  },
  providerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  providerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: AppColors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  providerToggleCard: {
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.28)",
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  providerToggleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  providerToggleTitle: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  providerToggleAction: {
    color: AppColors.primaryGreen,
    fontSize: 12,
    fontWeight: "600",
  },
  providerToggleBody: {
    marginTop: 8,
    gap: 6,
  },
  providerDetailText: {
    color: AppColors.lightGray,
    fontSize: 12,
    lineHeight: 18,
  },
  reportActionArea: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  top3ButtonContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reportActionButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  top3ActionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 0, 0, 0.48)",
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.55)",
    paddingHorizontal: 16,
    alignItems: "center",
  },
  top3InfoSpacer: {
    width: 28,
    height: 28,
  },
  top3ActionLabel: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  top3ActionText: {
    color: AppColors.primaryGreen,
    fontSize: 12,
    textAlign: "center",
    flexShrink: 1,
  },
  top3InfoButton: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  top3InfoButtonText: {
    color: AppColors.primaryGreen,
    fontSize: 13,
    fontWeight: "900",
    top: -0.5,
  },
  infoButton: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(63, 221, 144, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.5)",
  },
  infoButtonText: {
    color: AppColors.primaryGreen,
    fontSize: 18,
    fontWeight: "900",
  },
  reportActionText: {
    color: AppColors.black,
    fontSize: 13,
    fontWeight: "700",
  },
  reportActionDivider: {
    display: "none",
  },
  optionButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  optionButtonText: {
    color: AppColors.primaryGreen,
    fontSize: 11,
    fontWeight: "600",
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
    color: "#F07C7C",
    fontSize: 12,
  },
  top3ModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  top3ModalContent: {
    width: "100%",
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.3)",
    gap: 16,
  },
  top3ModalTitle: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  top3ModalSubtitle: {
    color: AppColors.primaryGreen,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  top3ModalImagePlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  top3ModalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  top3ModalBody: {
    color: AppColors.lightGray,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  top3ModalClose: {
    height: 48,
    borderRadius: 10,
    backgroundColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  top3ModalCloseText: {
    color: AppColors.black,
    fontSize: 15,
    fontWeight: "700",
  },
});
