// `.env` 파일에서 API 주소를 읽습니다.
// `EXPO_PUBLIC_` 접두사가 붙은 환경 변수는 앱 런타임에서도 접근할 수 있습니다.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080";

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  REFRESH: `${API_BASE_URL}/api/auth/refresh`,

  EMAIL_REQUEST: `${API_BASE_URL}/api/auth/email-request`,
  VERIFY_LINK: `${API_BASE_URL}/api/auth/verify-link`,

  PASSWORD_CODE_REQUEST: `${API_BASE_URL}/api/auth/password/code-request`,
  PASSWORD_VERIFY: `${API_BASE_URL}/api/auth/password/verify`,
  PASSWORD_RESET: `${API_BASE_URL}/api/auth/password/reset`,
  PASSWORD_CHANGE: `${API_BASE_URL}/api/auth/password/change`,

  CURATION_START: `${API_BASE_URL}/api/v1/curation/start`,
  CURATION_ANSWER: `${API_BASE_URL}/api/v1/curation/answer`,

  PROFILE_UPDATE: `${API_BASE_URL}/api/user/profile`,
  ACCOUNT_WITHDRAW: `${API_BASE_URL}/api/user/withdraw`,
};
