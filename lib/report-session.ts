import AsyncStorage from "@react-native-async-storage/async-storage";

export type AIProvider = "chatgpt" | "gemini" | "perplexity";

export type CategoryQuestion = {
  attribute_key: string;
  display_label: string;
  question_text: string;
  options: string[];
  user_answer: string | null;
};

export type ReportProduct = {
  id: string;
  name: string;
  price: string;
  specs: string[];
  link: string;
  store: string;
  reason: string;
};

export type ProviderReport = {
  provider: AIProvider;
  providerLabel: string;
  headline: string;
  summary: string;
  products: ReportProduct[];
};

export type ReportSession = {
  id: string;
  categoryName: string;
  initialQuestion: string;
  summary: string;
  answers: Array<{
    question: string;
    answer: string;
  }>;
  providers: ProviderReport[];
};

const SESSION_KEY = "currentReportSession";

const PROVIDER_LABELS: Record<AIProvider, string> = {
  chatgpt: "Chat GPT",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

const BASE_PRODUCTS: Record<AIProvider, ReportProduct[]> = {
  chatgpt: [
    {
      id: "chatgpt-1",
      name: "Lenovo ThinkPad T14s Gen 6",
      price: "2,089,000원",
      specs: ["Core Ultra 7", "RAM 32GB", "SSD 1TB", '14"', "1.2kg"],
      link: "https://www.lenovo.com",
      store: "Lenovo",
      reason: "업무 안정성과 휴대성 균형이 좋아 실무용으로 무난합니다.",
    },
    {
      id: "chatgpt-2",
      name: "LG gram Pro 16",
      price: "1,890,000원",
      specs: ["Core i7", "RAM 16GB", "SSD 512GB", '16"', "1.19kg"],
      link: "https://www.lge.co.kr",
      store: "LG전자",
      reason: "큰 화면과 가벼운 무게를 동시에 챙길 수 있습니다.",
    },
    {
      id: "chatgpt-3",
      name: "MacBook Air M3",
      price: "1,690,000원",
      specs: ["Apple M3", "RAM 16GB", "SSD 512GB", '13"', "1.24kg"],
      link: "https://www.apple.com/kr",
      store: "Apple",
      reason: "배터리 지속시간이 좋아 이동이 많은 환경에 잘 맞습니다.",
    },
  ],
  gemini: [
    {
      id: "gemini-1",
      name: "Samsung Galaxy Book5 Pro 16",
      price: "1,999,000원",
      specs: ["Core Ultra 7", "RAM 32GB", "SSD 1TB", '16"', "OLED"],
      link: "https://www.samsung.com/sec",
      store: "삼성전자",
      reason: "문서 작업과 멀티태스킹 체감이 안정적입니다.",
    },
    {
      id: "gemini-2",
      name: "ASUS Zenbook 14 OLED",
      price: "1,749,000원",
      specs: ["Ryzen 7", "RAM 16GB", "SSD 1TB", '14"', "OLED"],
      link: "https://www.asus.com/kr",
      store: "ASUS",
      reason: "디스플레이 품질과 휴대성을 함께 챙기기 좋습니다.",
    },
    {
      id: "gemini-3",
      name: "LG gram 14",
      price: "1,590,000원",
      specs: ["Core i5", "RAM 16GB", "SSD 512GB", '14"', "999g"],
      link: "https://www.lge.co.kr",
      store: "LG전자",
      reason: "가벼운 무게가 가장 중요한 조건일 때 선택하기 좋습니다.",
    },
  ],
  perplexity: [
    {
      id: "perplexity-1",
      name: "HP Pavilion Plus 14",
      price: "1,529,000원",
      specs: ["Ryzen 7", "RAM 16GB", "SSD 512GB", '14"', "OLED"],
      link: "https://www.hp.com/kr-ko",
      store: "HP",
      reason: "가성비 기준으로 균형이 좋은 모델입니다.",
    },
    {
      id: "perplexity-2",
      name: "Dell Inspiron 14 Plus",
      price: "1,689,000원",
      specs: ["Core Ultra 7", "RAM 16GB", "SSD 1TB", '14"', "QHD+"],
      link: "https://www.dell.com/ko-kr",
      store: "Dell",
      reason: "확장성과 포트 구성이 좋아 다양한 작업에 대응하기 좋습니다.",
    },
    {
      id: "perplexity-3",
      name: "Apple MacBook Air 13",
      price: "1,590,000원",
      specs: ["Apple M2", "RAM 16GB", "SSD 512GB", '13"', "최대 18시간"],
      link: "https://www.apple.com/kr",
      store: "Apple",
      reason: "배터리 중심 조건에서는 여전히 강한 선택지입니다.",
    },
  ],
};

function buildSummary(initialQuestion: string, answers: ReportSession["answers"]) {
  const answerSummary = answers.map((item) => `${item.question}: ${item.answer}`).join(" / ");
  return `${initialQuestion} 요청을 바탕으로 ${answerSummary} 조건을 반영해 추천 리포트를 정리했습니다.`;
}

function buildProviderReport(
  provider: AIProvider,
  sessionSummary: string,
  answers: ReportSession["answers"],
): ProviderReport {
  const focus = answers.slice(0, 2).map((item) => item.answer).join(", ");

  return {
    provider,
    providerLabel: PROVIDER_LABELS[provider],
    headline: `${PROVIDER_LABELS[provider]}가 본 핵심 조건`,
    summary: `${sessionSummary} ${PROVIDER_LABELS[provider]} 관점에서는 ${focus || "기본 성능과 사용성"}을 특히 중요하게 봤습니다.`,
    products: BASE_PRODUCTS[provider],
  };
}

export function buildReportSession(input: {
  categoryName: string;
  initialQuestion: string;
  questions: CategoryQuestion[];
}) {
  const answers = input.questions
    .filter((question) => question.user_answer)
    .map((question) => ({
      question: question.display_label || question.question_text,
      answer: question.user_answer as string,
    }));

  const summary = buildSummary(input.initialQuestion, answers);

  return {
    id: `${Date.now()}`,
    categoryName: input.categoryName,
    initialQuestion: input.initialQuestion,
    summary,
    answers,
    providers: (Object.keys(PROVIDER_LABELS) as AIProvider[]).map((provider) =>
      buildProviderReport(provider, summary, answers),
    ),
  } satisfies ReportSession;
}

export async function saveReportSession(session: ReportSession) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function getReportSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  return JSON.parse(raw) as ReportSession;
}
