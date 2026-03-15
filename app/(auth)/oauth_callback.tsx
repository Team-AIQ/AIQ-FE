import { saveAuthTokens } from "@/lib/auth-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, Text, View } from "react-native";

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
        router.replace("/(auth)/onboarding");
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
