import { getAccessToken } from "@/lib/auth-storage";

type RequestOptions = Omit<RequestInit, "headers" | "body"> & {
  body?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function getErrorMessage(status: number, payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const message =
      record.message ??
      record.error ??
      record.detail ??
      record.title;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (status === 401) return "로그인이 필요합니다.";
  if (status === 403) return "이 요청을 처리할 권한이 없습니다.";
  if (status === 404) return "요청한 리소스를 찾을 수 없습니다.";
  if (status >= 500) return "서버 오류가 발생했습니다.";

  return fallback;
}

export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    headers = {},
    requireAuth = false,
    timeoutMs = 10000,
    ...rest
  } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (requireAuth) {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new ApiError("로그인이 필요합니다.", 401);
    }

    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(`Request timed out after ${timeoutMs}ms (${url}).`, 0, error);
    }
    throw new ApiError(
      `Network error: unable to reach server (${url}). Check API base URL / Wi-Fi / backend status.`,
      0,
      error,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? tryParseJson(text) : undefined;

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(response.status, payload, `Request failed with status ${response.status}`),
      response.status,
      payload ?? text,
    );
  }

  if (!text) {
    return undefined as T;
  }

  return ((payload ?? text) as T);
}
