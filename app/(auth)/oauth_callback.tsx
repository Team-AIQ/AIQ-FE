import { saveAuthTokens } from "@/lib/auth-storage";
import {
  clearPendingOnboarding,
  hasPendingOnboarding,
  hasSeenOnboarding,
  updateUserProfile,
} from "@/lib/user-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, Text, View } from "react-native";
import { jwtDecode } from "jwt-decode";

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { accessToken, refreshToken } = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
  }>();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!accessToken || !refreshToken) {
          Alert.alert("로그인 실패", "토큰을 전달받지 못했습니다.");
          router.replace("/(auth)/login");
          return;
        }

        await saveAuthTokens(accessToken, refreshToken);
        const decoded = jwtDecode<Record<string, unknown>>(accessToken);
        const nicknameFromToken =
          (decoded.nickname as string | undefined) ??
          (decoded.name as string | undefined) ??
          (decoded.userName as string | undefined) ??
          (decoded.username as string | undefined);
        const emailFromToken = decoded.email as string | undefined;
        await updateUserProfile({
          email: emailFromToken,
          nickname: nicknameFromToken,
        });
        const userKey =
          (decoded.userId as number | undefined)?.toString() ?? emailFromToken;
        const alreadySeen = await hasSeenOnboarding(userKey);
        const pending = await hasPendingOnboarding(userKey);
        const isNewUser =
          (decoded.isNewUser as boolean | undefined) ??
          (decoded.newUser as boolean | undefined) ??
          false;
        if (alreadySeen) {
          router.replace("/(tabs)");
        } else if (pending || isNewUser) {
          await clearPendingOnboarding(userKey);
          router.replace("/(auth)/onboarding");
        } else {
          router.replace("/(tabs)");
        }
      } catch {
        Alert.alert("로그인 오류", "로그인 처리 중 문제가 발생했습니다.");
        router.replace("/(auth)/login");
      }
    };

    handleCallback();
  }, [accessToken, refreshToken, router]);

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
