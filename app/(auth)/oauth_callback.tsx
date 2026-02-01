import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { Alert, Text, View } from "react-native";

export default function OAuthCallbackScreen() {
  const router = useRouter();

  // ✅ expo-router 방식의 쿼리 파라미터 수신
  const { accessToken, refreshToken } = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
  }>();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 파라미터 검증
        if (!accessToken || !refreshToken) {
          Alert.alert("로그인 실패", "토큰을 받지 못했습니다.");
          router.replace("/(auth)/login");
          return;
        }

        // ✅ SecureStore에 토큰 저장
        await SecureStore.setItemAsync("accessToken", accessToken);
        await SecureStore.setItemAsync("refreshToken", refreshToken);

        // ✅ 메인 화면 이동
        router.replace("/(auth)/onboarding");
      } catch (error) {
        console.error("OAuth Callback Error:", error);
        Alert.alert("로그인 오류", "로그인 처리 중 오류가 발생했습니다.");
        router.replace("/(auth)/login");
      }
    };

    handleCallback();
  }, [accessToken, refreshToken]);

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
