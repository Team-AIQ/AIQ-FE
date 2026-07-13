import {
  clearAuthTokens,
  getAccessToken,
  saveAuthTokens,
} from "@/lib/auth-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// 🌟 [추가] 구글 모바일 광고 SDK 임포트
import mobileAds from "react-native-google-mobile-ads";

const { width, height } = Dimensions.get("window");

const COLORS = {
  green: "#3CC194",
};

export default function SplashScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
  }>();
  const hasBootstrappedRef = useRef(false);

  const translateY = useRef(new Animated.Value(-16)).current;
  const [showBeam, setShowBeam] = useState(false);

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (hasBootstrappedRef.current) {
        return false;
      }
      hasBootstrappedRef.current = true;

      // 🌟 [추가] 앱이 켜질 때 광고 SDK를 가장 먼저 초기화합니다.
      try {
        console.log("[Splash] 모바일 광고 SDK 초기화 시작...");
        await mobileAds().initialize();
        console.log("[Splash] 모바일 광고 SDK 초기화 완료!");
      } catch (error) {
        console.error("[Splash] 광고 SDK 초기화 실패:", error);
      }

      let accessToken = Array.isArray(params.accessToken)
        ? params.accessToken[0]
        : params.accessToken;
      let refreshToken = Array.isArray(params.refreshToken)
        ? params.refreshToken[0]
        : params.refreshToken;

      if (accessToken && refreshToken) {
        console.log("[Splash] Params token detected");
        await saveAuthTokens(accessToken, refreshToken);
        const onboardingRequired =
          (await AsyncStorage.getItem("onboarding_required")) === "true";
        router.replace(onboardingRequired ? "/(auth)/onboarding" : "/(tabs)");
        return true;
      }

      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log("[Splash] Initial URL", initialUrl);
        const parsed = Linking.parse(initialUrl);
        const accessTokenParam = parsed.queryParams?.accessToken;
        const refreshTokenParam = parsed.queryParams?.refreshToken;
        accessToken = Array.isArray(accessTokenParam)
          ? accessTokenParam[0]
          : accessTokenParam;
        refreshToken = Array.isArray(refreshTokenParam)
          ? refreshTokenParam[0]
          : refreshTokenParam;

        if (accessToken && refreshToken) {
          await saveAuthTokens(accessToken, refreshToken);
          const onboardingRequired =
            (await AsyncStorage.getItem("onboarding_required")) === "true";
          router.replace(onboardingRequired ? "/(auth)/onboarding" : "/(tabs)");
          return true;
        }
      }

      const autoLoginEnabled =
        (await AsyncStorage.getItem("autoLogin")) === "true";
      if (!autoLoginEnabled) {
        await clearAuthTokens();
        router.replace("/(auth)/welcome");
        return false;
      }

      const token = await getAccessToken();
      const onboardingRequired =
        (await AsyncStorage.getItem("onboarding_required")) === "true";
      router.replace(
        token
          ? onboardingRequired
            ? "/(auth)/onboarding"
            : "/(tabs)"
          : "/(auth)/welcome",
      );
      return false;
    };

    const beamTimer = setTimeout(() => {
      setShowBeam(true);
    }, 300);

    Animated.timing(translateY, {
      toValue: 0,
      duration: 700,
      delay: 300,
      useNativeDriver: true,
    }).start();

    const exitTimer = setTimeout(async () => {
      await bootstrapAuth();
    }, 2500);

    return () => {
      clearTimeout(beamTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.logoArea}>
          <Image
            source={require("../assets/images/aiq-animation-logo2.gif")}
            style={styles.beamLogo}
            resizeMode="contain"
          />
        </View>

        <Animated.View
          style={[styles.movingGroup, { transform: [{ translateY }] }]}
        >
          <Image
            source={require("../assets/images/aiq-text-logo.png")}
            style={styles.textLogo}
            resizeMode="contain"
          />
          <Image
            source={require("../assets/images/stay-pickle.png")}
            style={styles.character}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

/* =========================
   스타일 (레이아웃 재조정)
   ========================= */

const styles = StyleSheet.create({
  /* SafeArea 포함 전체 배경 */
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.green,
  },

  /* 화면 전체 컨테이너 */
  container: {
    flex: 1,
    backgroundColor: COLORS.green,
    alignItems: "center",
  },

  /* =========================
     빔 로고 (정중앙 고정)
     ========================= */
  logoArea: {
    position: "absolute",
    top: height * 0.26, // ❗️화면 중앙 기준 (겹침 방지 핵심)
    left: 0,
    right: 0,
    alignItems: "center",
  },

  beamLogo: {
    width: width * 0.38,
    height: height * 0.19,
  },

  /* =========================
     AIQ 글씨 + 캐릭터 그룹
     (같이 살짝 내려감)
     ========================= */
  movingGroup: {
    position: "absolute",
    top: height * 0.42, // ❗️시작부터 빔 아래 (겹치지 않게)
    alignItems: "center",
  },

  /* AIQ 텍스트 로고 */
  textLogo: {
    width: width * 0.34,
    height: height * 0.075,
    marginBottom: 56, // ❗️글씨 ↔ 캐릭터 간격 (조금 더 여유)
  },

  /* 캐릭터 */
  character: {
    width: width * 0.68,
    height: height * 0.5,
    marginTop: 10,
    marginBottom: -height * 0.12, // ❗️다리 살짝 가림
  },
});
