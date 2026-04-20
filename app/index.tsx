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

const { width, height } = Dimensions.get("window");

const COLORS = {
  green: "#3CC194", // GIF 배경색과 동일하게 맞춤
};

export default function SplashScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
  }>();
  const hasBootstrappedRef = useRef(false);

  /** AIQ 글씨 + 캐릭터 공통 이동 */
  const translateY = useRef(new Animated.Value(-16)).current;

  /** 빔 on/off */
  const [showBeam, setShowBeam] = useState(false);
  useEffect(() => {
    const bootstrapAuth = async () => {
      if (hasBootstrappedRef.current) {
        return false;
      }
      hasBootstrappedRef.current = true;

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

    // 1️⃣ 빔 등장
    const beamTimer = setTimeout(() => {
      setShowBeam(true);
    }, 300);

    // 2️⃣ 글씨 + 캐릭터 같이 아주 살짝 하강
    Animated.timing(translateY, {
      toValue: 0,
      duration: 700,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // 3️⃣ 스플래시 종료
    const exitTimer = setTimeout(async () => {
      await bootstrapAuth();
    }, 2500);

    return () => {
      clearTimeout(beamTimer);
      clearTimeout(exitTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        {/* ======================
            그림 로고 (고정)
           ====================== */}
        <View style={styles.logoArea}>
          <Image
            source={require("../assets/images/aiq-animation-logo2.gif")}
            style={styles.beamLogo}
            resizeMode="contain"
          />
        </View>

        {/* ======================
            AIQ 글씨 + 캐릭터
            (같이 내려감)
           ====================== */}
        <Animated.View
          style={[styles.movingGroup, { transform: [{ translateY }] }]}
        >
          {/* AIQ 텍스트 */}
          <Image
            source={require("../assets/images/aiq-text-logo.png")}
            style={styles.textLogo}
            resizeMode="contain"
          />

          {/* 캐릭터 (전체 이미지 그대로) */}
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
