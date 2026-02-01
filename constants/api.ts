// .env 파일에서 API 주소를 가져옴
// EXPO_PUBLIC_ 접두사가 붙은 환경변수는 클라이언트에서 접근 가능
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080";

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  REFRESH: `${API_BASE_URL}/api/auth/refresh`,

  // Email verification
  EMAIL_REQUEST: `${API_BASE_URL}/api/auth/email-request`,
  VERIFY_LINK: `${API_BASE_URL}/api/auth/verify-link`,

  // Password reset
  PASSWORD_CODE_REQUEST: `${API_BASE_URL}/api/auth/password/code-request`,
  PASSWORD_VERIFY: `${API_BASE_URL}/api/auth/password/verify`,
  PASSWORD_RESET: `${API_BASE_URL}/api/auth/password/reset`,

  // Curation (AI 대화)
  CURATION_START: `${API_BASE_URL}/api/v1/curation/start`,
  // CURATION_ANSWER: `${API_BASE_URL}/api/v1/curation/answer`, // TODO: 답변 제출 API
};
