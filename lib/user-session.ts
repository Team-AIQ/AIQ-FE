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
const ONBOARDING_SEEN_KEY = "onboardingSeenByUser";
const ONBOARDING_PENDING_KEY = "onboardingPendingByUser";

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
  if (!raw) return 20;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 20;
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
      PROFILE_KEY,
      AI_SETTINGS_KEY,
      CREDITS_KEY,
      CHAT_HISTORY_KEY,
      ONBOARDING_SEEN_KEY,
      ONBOARDING_PENDING_KEY,
      "currentReportSession",
    ]),
    SecureStore.deleteItemAsync("accessToken"),
    SecureStore.deleteItemAsync("refreshToken"),
  ]);
}

type OnboardingSeenMap = Record<string, boolean>;

function getOnboardingUserKey(userKey?: string) {
  if (userKey && userKey.trim()) return userKey.trim();
  return "anonymous";
}

async function getOnboardingSeenMap() {
  const raw = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
  if (!raw) return {} as OnboardingSeenMap;
  return JSON.parse(raw) as OnboardingSeenMap;
}

export async function hasSeenOnboarding(userKey?: string) {
  const map = await getOnboardingSeenMap();
  return Boolean(map[getOnboardingUserKey(userKey)]);
}

export async function markOnboardingSeen(userKey?: string) {
  const key = getOnboardingUserKey(userKey);
  const map = await getOnboardingSeenMap();
  map[key] = true;
  await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, JSON.stringify(map));
}

async function getOnboardingPendingMap() {
  const raw = await AsyncStorage.getItem(ONBOARDING_PENDING_KEY);
  if (!raw) return {} as OnboardingSeenMap;
  return JSON.parse(raw) as OnboardingSeenMap;
}

export async function hasPendingOnboarding(userKey?: string) {
  const map = await getOnboardingPendingMap();
  return Boolean(map[getOnboardingUserKey(userKey)]);
}

export async function setPendingOnboarding(userKey?: string) {
  const key = getOnboardingUserKey(userKey);
  const map = await getOnboardingPendingMap();
  map[key] = true;
  await AsyncStorage.setItem(ONBOARDING_PENDING_KEY, JSON.stringify(map));
}

export async function clearPendingOnboarding(userKey?: string) {
  const key = getOnboardingUserKey(userKey);
  const map = await getOnboardingPendingMap();
  if (map[key]) {
    delete map[key];
    await AsyncStorage.setItem(ONBOARDING_PENDING_KEY, JSON.stringify(map));
  }
}
