import { API_ENDPOINTS } from "@/constants/api";
import { apiRequest } from "@/lib/api-client";
import { saveAuthTokens } from "@/lib/auth-storage";
import {
  hasPendingOnboarding,
  setCredits,
  updateUserProfile,
} from "@/lib/user-session";
import { parseUserSnapshot } from "@/lib/user-snapshot";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, Text, View } from "react-native";

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
  }>();

  console.log("[OAuthCallback] Screen loaded");
  console.log("[OAuthCallback] params:", params);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        let resolvedEmail = "";
        // params에서 먼저 시도, 없으면 현재 URL에서 파싱
        let accessToken = Array.isArray(params.accessToken)
          ? params.accessToken[0]
          : params.accessToken;
        let refreshToken = Array.isArray(params.refreshToken)
          ? params.refreshToken[0]
          : params.refreshToken;

        if (!accessToken || !refreshToken) {
          const url = await Linking.getInitialURL();
          if (url) {
            const parsed = Linking.parse(url);
            const at = parsed.queryParams?.accessToken;
            const rt = parsed.queryParams?.refreshToken;
            accessToken = Array.isArray(at) ? at[0] : (at ?? undefined);
            refreshToken = Array.isArray(rt) ? rt[0] : (rt ?? undefined);
          }
        }

        if (!accessToken || !refreshToken) {
          Alert.alert("로그인 실패", "토큰을 전달받지 못했습니다.");
          router.replace("/(auth)/welcome");
          return;
        }

        await saveAuthTokens(accessToken, refreshToken);

        // Fetch actual profile from server after OAuth login
        try {
          const profileData = await apiRequest<any>(
            API_ENDPOINTS.PROFILE_UPDATE,
            {
              method: "GET",
              requireAuth: true,
            },
          );
          const snapshot = parseUserSnapshot(profileData);
          const serverNickname = snapshot.nickname ?? "";
          const serverEmail = snapshot.email ?? "";
          const serverCredits = snapshot.credits;
          resolvedEmail = serverEmail.trim();
          await updateUserProfile({
            nickname: serverNickname || undefined,
            email: serverEmail || undefined,
          });
          if (
            typeof serverCredits === "number" &&
            Number.isFinite(serverCredits)
          ) {
            await setCredits(serverCredits);
          }
        } catch {
          // Profile fetch failed; proceed with empty profile
        }

        const onboardingPending = await hasPendingOnboarding(resolvedEmail);
        router.replace(onboardingPending ? "/(auth)/onboarding" : "/(tabs)");
      } catch {
        Alert.alert("로그인 오류", "로그인 처리 중 문제가 발생했습니다.");
        router.replace("/(auth)/welcome");
      }
    };

    handleCallback();
  }, [params.accessToken, params.refreshToken, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
      }}
    >
      <Text style={{ color: "#FFF" }}>로그인 처리 중...</Text>
    </View>
  );
}
