import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export type UserProfile = {
  nickname: string;
  email: string;
};

export type AIProviderSettings = {
  chatgpt: boolean;
  gemini: boolean;
  perplexity: boolean;
};

export type ChatHistoryItem = {
  id: string;
  title: string;
  createdAt: string;
};

const PROFILE_KEY = "userProfile";
const AI_SETTINGS_KEY = "aiProviderSettings";
const CREDITS_KEY = "userCredits";
const CHAT_HISTORY_KEY = "chatHistory";

const DEFAULT_AI_SETTINGS: AIProviderSettings = {
  chatgpt: true,
  gemini: true,
  perplexity: true,
};

export async function getUserProfile() {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return null;

  return JSON.parse(raw) as UserProfile;
}

export async function saveUserProfile(profile: UserProfile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function updateUserProfile(profile: Partial<UserProfile>) {
  const current = await getUserProfile();
  const next = {
    nickname: profile.nickname ?? current?.nickname ?? "",
    email: profile.email ?? current?.email ?? "",
  };
  await saveUserProfile(next);
}

export async function getAIProviderSettings() {
  const raw = await AsyncStorage.getItem(AI_SETTINGS_KEY);
  if (!raw) return DEFAULT_AI_SETTINGS;

  return { ...DEFAULT_AI_SETTINGS, ...(JSON.parse(raw) as AIProviderSettings) };
}

export async function saveAIProviderSettings(settings: AIProviderSettings) {
  await AsyncStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

export async function getCredits() {
  const raw = await AsyncStorage.getItem(CREDITS_KEY);
  if (!raw) return 100;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 100;
}

export async function setCredits(value: number) {
  await AsyncStorage.setItem(CREDITS_KEY, String(value));
}

export async function decrementCredits(amount: number) {
  const current = await getCredits();
  const next = Math.max(0, current - amount);
  await setCredits(next);
  return next;
}

export async function getChatHistory() {
  const raw = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
  if (!raw) return [] as ChatHistoryItem[];

  return JSON.parse(raw) as ChatHistoryItem[];
}

export async function addChatHistory(title: string) {
  const history = await getChatHistory();
  const nextItem: ChatHistoryItem = {
    id: `${Date.now()}`,
    title,
    createdAt: new Date().toISOString(),
  };

  const nextHistory = [nextItem, ...history].slice(0, 15);
  await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(nextHistory));
}

export async function clearSessionData() {
  await Promise.all([
    AsyncStorage.multiRemove([
      "accessToken",
      "refreshToken",
      "autoLogin",
      PROFILE_KEY,
      AI_SETTINGS_KEY,
      CREDITS_KEY,
      CHAT_HISTORY_KEY,
      "currentReportSession",
    ]),
    SecureStore.deleteItemAsync("accessToken"),
    SecureStore.deleteItemAsync("refreshToken"),
  ]);
}
