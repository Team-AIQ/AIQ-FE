// `.env` 파일에서 API 주소를 읽습니다.
// `EXPO_PUBLIC_` 접두사가 붙은 환경 변수는 앱 런타임에서도 접근할 수 있습니다.
import Constants from "expo-constants";
import { Platform } from "react-native";

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function getDevHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (typeof hostUri === "string" && hostUri.trim()) {
    return hostUri.split(":")[0];
  }

  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (typeof debuggerHost === "string" && debuggerHost.trim()) {
    return debuggerHost.split(":")[0];
  }

  return undefined;
}

function resolveApiBaseUrl() {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (typeof envBaseUrl === "string" && envBaseUrl.trim()) {
    return normalizeBaseUrl(envBaseUrl);
  }

  if (__DEV__) {
    if (Platform.OS === "android" && Constants.isDevice === false) {
      return "http://10.0.2.2:8080";
    }

    const devHost = getDevHost();
    if (devHost) {
      return `http://${devHost}:8080`;
    }
  }

  return "http://localhost:8080";
}

export const API_BASE_URL = resolveApiBaseUrl();

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
  ACCOUNT_WITHDRAW: `${API_BASE_URL}/api/auth/withdraw`,
};
