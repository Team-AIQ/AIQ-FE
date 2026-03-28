import type { CategoryQuestion } from "@/lib/report-session";

export type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

export type ErrorResponse = {
  message?: string;
  error?: string;
  detail?: string;
  title?: string;
};

export type CurationResponse = {
  queryId: number;
  categoryName: string;
  questions: CategoryQuestion[];
  message: string;
};

export type CurationAnswerResponse = Partial<CurationResponse> & {
  done?: boolean;
  reportReady?: boolean;
  nextQuestion?: CategoryQuestion | null;
};

export type ApiResponse<T> = {
  status: number;
  message: string;
  data?: T;
};

export type HistoryResponseItem = {
  queryId: number;
  question: string;
  createdAt: string;
};

export type ProductRecommendation = {
  productName: string;
  productCode: string;
  targetAudience: string;
  selectionReasons: string[];
};

export type AiRecommendationResponse = {
  modelName: string;
  recommendations: ProductRecommendation[];
  specGuide: string;
  finalWord: string;
};

export type TopProduct = {
  rank: number;
  productName: string;
  productCode: string;
  price: string;
  productImage: string;
  specs: Record<string, string>;
  lowestPriceLink: string;
  comparativeAnalysis: string;
};

export type FinalReportResponse = {
  consensus: string;
  decisionBranches: string;
  aiqRecommendationReason: string;
  topProducts: TopProduct[];
  finalWord: string;
};
