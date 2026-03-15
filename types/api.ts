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
