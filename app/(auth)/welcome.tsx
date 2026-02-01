import { AppColors } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import {
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE_URL } from "@/constants/api";

const { width, height } = Dimensions.get("window");

/** OAuth URLs - API_BASE_URL 사용, origin=app 파라미터로 앱에서 호출임을 알림 */
const OAUTH_URLS = {
  kakao: `${API_BASE_URL}/oauth2/authorization/kakao?origin=app`,
  google: `${API_BASE_URL}/oauth2/authorization/google?origin=app`,
  naver: `${API_BASE_URL}/oauth2/authorization/naver?origin=app`,
};

// 딥링크 스킴 (Expo 앱용) - .env에서 가져옴
const REDIRECT_URL =
  process.env.EXPO_PUBLIC_REDIRECT_URL || "exp://localhost:8081";

export default function WelcomeScreen() {
  const router = useRouter();

  /** OAuth 로그인 처리 */
  const handleOAuthLogin = async (provider: "kakao" | "google" | "naver") => {
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        OAUTH_URLS[provider],
        REDIRECT_URL,
      );

      if (result.type !== "success") {
        Alert.alert("로그인 취소", "로그인이 취소되었습니다.");
      }
      // ✅ 토큰 처리 없음 (콜백 화면에서 처리)
    } catch (error) {
      console.error("OAuth Error:", error);
      Alert.alert("로그인 오류", "로그인 중 문제가 발생했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        {/* 로고 영역 */}
        <View style={styles.logoArea}>
          <Image
            source={require("../../assets/images/auth-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* =====================
            OAuth 버튼 영역
        ===================== */}
        <View style={styles.buttonArea}>
          {/* 카카오 */}
          <TouchableOpacity
            style={[styles.button, styles.kakao]}
            onPress={() => handleOAuthLogin("kakao")}
          >
            <Image
              source={require("../../assets/images/kakao.png")}
              style={styles.kakaoIcon}
              resizeMode="contain"
            />
            <Text style={styles.kakaoText}>카카오로 계속하기</Text>
          </TouchableOpacity>

          {/* 구글 */}
          <TouchableOpacity
            style={[styles.button, styles.google]}
            onPress={() => handleOAuthLogin("google")}
          >
            <Image
              source={require("../../assets/images/Google Logo.png")}
              style={styles.oauthIcon}
            />
            <Text style={styles.googleText}>Google로 계속하기</Text>
          </TouchableOpacity>

          {/* 네이버 */}
          <TouchableOpacity
            style={[styles.button, styles.naver]}
            onPress={() => handleOAuthLogin("naver")}
          >
            <Image
              source={require("../../assets/images/naver logo.png")}
              style={styles.oauthIcon}
            />
            <Text style={styles.naverText}>네이버로 계속하기</Text>
          </TouchableOpacity>

          {/* 약관 텍스트 */}
          <Text style={styles.terms}>
            <Text style={styles.termsGray}>
              회원가입 없이 이용 가능하며 첫 로그인시{" "}
            </Text>
            <Text style={styles.termsGreen}>이용약관</Text>
            {"\n"}
            <Text style={styles.termsGray}>및 </Text>
            <Text style={styles.termsGreen}>개인정보처리방침</Text>
            <Text style={styles.termsGray}> 동의로 간주합니다</Text>
          </Text>

          {/* 이메일 로그인/가입 */}
          <View style={styles.emailLinks}>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.emailLink}>이메일로 로그인</Text>
            </TouchableOpacity>
            <Text style={styles.emailDivider}>|</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.emailLink}>이메일로 가입</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* =====================
   styles
===================== */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "space-between",
    paddingVertical: 40,
  },

  /** 로고 영역 */
  logoArea: {
    alignItems: "center",
    marginTop: 80,
  },
  logo: {
    width: width * 3,
    height: height * 0.25,
  },
  symbolLogo: {
    width: 150,
    height: 150,
  },
  textLogo: {
    width: 100,
    height: 50,
    marginBottom: 2,
  },
  subtitle: {
    color: AppColors.primaryGreen,
    fontSize: 15,
    marginTop: 15,
  },

  /** 버튼 영역 */
  buttonArea: {
    paddingHorizontal: 43,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 8,
    marginBottom: 15,
  },
  oauthIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  kakaoIcon: {
    width: 17,
    height: 19,
    marginRight: 8,
  },

  kakao: { backgroundColor: "#FEE500" },
  kakaoText: { color: "#000", fontWeight: "600" },

  google: { backgroundColor: "#FFF" },
  googleText: { color: "#000", fontWeight: "600" },

  naver: { backgroundColor: AppColors.primaryGreen },
  naverText: { color: "#FFF", fontWeight: "600" },

  terms: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 16,
  },
  termsWhite: {
    color: "#FFF",
  },
  termsGray: {
    color: "#CACACA",
  },
  termsGreen: {
    color: AppColors.primaryGreen,
  },
  emailLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
    marginBottom: 5,
  },
  emailLink: {
    color: "#FFF",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  emailDivider: {
    color: "#FFF",
    fontSize: 13,
    marginHorizontal: 8,
  },
});
