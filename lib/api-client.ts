import { getAccessToken } from "@/lib/auth-storage";

type RequestOptions = Omit<RequestInit, "headers" | "body"> & {
  body?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
};

export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers = {}, requireAuth = false, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (requireAuth) {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("로그인이 필요합니다.");
    }

    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
