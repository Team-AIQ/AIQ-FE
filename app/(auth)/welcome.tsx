import { LegalModal } from "@/components/legal-modal";
import { API_BASE_URL } from "@/constants/api";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/constants/legal";
import { AppColors } from "@/constants/theme";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
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

const { width, height } = Dimensions.get("window");
const IS_SMALL = height < 740;

const OAUTH_URLS = {
  kakao: `${API_BASE_URL}/oauth2/authorization/kakao?origin=app`,
  google: `${API_BASE_URL}/oauth2/authorization/google?origin=app`,
  naver: `${API_BASE_URL}/oauth2/authorization/naver?origin=app`,
};

//const REDIRECT_URL =
//  process.env.EXPO_PUBLIC_REDIRECT_URL || "exp://localhost:8081";

// Expo Go OAuth 콜백 주소
// 백엔드 application.properties의 redirect-uri와 동일해야 함
// 빌드용 앱 딥링크 주소
const REDIRECT_URL =
  process.env.EXPO_PUBLIC_REDIRECT_URL || "aiq://oauth/callback";

type LegalType = "privacy" | "terms" | null;

export default function WelcomeScreen() {
  const router = useRouter();
  const [legalType, setLegalType] = useState<LegalType>(null);

  const handleOAuthLogin = async (provider: "kakao" | "google" | "naver") => {
    try {
      // 실제 백엔드 소셜 로그인 요청 주소 확인
      console.log("[OAuth] 요청 URL:", OAUTH_URLS[provider]);

      // 앱으로 돌아올 딥링크 주소 확인
      console.log("[OAuth] Redirect URL:", REDIRECT_URL);

      // 소셜 로그인 브라우저 실행
      const result = await WebBrowser.openAuthSessionAsync(
        OAUTH_URLS[provider],
        REDIRECT_URL,
      );

      // 사용자가 로그인 창을 닫거나 인증을 취소한 경우
      if (result.type !== "success") {
        Alert.alert("로그인 취소", "소셜 로그인이 취소되었습니다.");
        return;
      }

      // 백엔드가 최종적으로 반환한 딥링크 URL
      // 예:
      // aiq://oauth/callback
      // ?accessToken=...
      // &refreshToken=...
      console.log("[OAuth] 반환 URL:", result.url);

      // 반환받은 딥링크 URL 분석
      const parsedUrl = Linking.parse(result.url);

      // URL 쿼리 파라미터에서 토큰 추출
      const accessTokenParam = parsedUrl.queryParams?.accessToken;
      const refreshTokenParam = parsedUrl.queryParams?.refreshToken;

      // expo-linking 반환 타입이 string 또는 string[]일 수 있으므로 처리
      const accessToken = Array.isArray(accessTokenParam)
        ? accessTokenParam[0]
        : accessTokenParam;

      const refreshToken = Array.isArray(refreshTokenParam)
        ? refreshTokenParam[0]
        : refreshTokenParam;

      // 토큰이 정상적으로 전달되지 않은 경우
      if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
        Alert.alert("로그인 실패", "소셜 로그인 토큰을 전달받지 못했습니다.");
        return;
      }

      // 기존에 만든 OAuth 콜백 화면으로 이동
      // callback.tsx에서 토큰 저장 및 메인 화면 이동 처리
      router.replace({
        pathname: "/oauth/callback",
        params: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      // 실제 오류 확인용 로그
      console.error("[OAuth] 로그인 처리 오류:", error);

      Alert.alert("로그인 오류", "로그인 중 문제가 발생했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoArea}>
            <Image
              source={require("../../assets/images/auth-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.buttonArea}>
            <TouchableOpacity
              style={[styles.button, styles.kakao]}
              onPress={() => handleOAuthLogin("kakao")}
              activeOpacity={0.88}
            >
              <Image
                source={require("../../assets/images/kakao.png")}
                style={styles.kakaoIcon}
                resizeMode="contain"
              />
              <Text allowFontScaling={false} style={styles.kakaoText}>
                카카오로 계속하기
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.google]}
              onPress={() => handleOAuthLogin("google")}
              activeOpacity={0.88}
            >
              <Image
                source={require("../../assets/images/Google Logo.png")}
                style={styles.oauthIcon}
              />
              <Text allowFontScaling={false} style={styles.googleText}>
                Google로 계속하기
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.naver]}
              onPress={() => handleOAuthLogin("naver")}
              activeOpacity={0.88}
            >
              <Image
                source={require("../../assets/images/naver logo.png")}
                style={styles.oauthIcon}
              />
              <Text allowFontScaling={false} style={styles.naverText}>
                네이버로 계속하기
              </Text>
            </TouchableOpacity>

            <Text allowFontScaling={false} style={styles.terms}>
              <Text style={styles.termsText}>
                회원가입 없이 이용 가능하며 로그인 시{" "}
              </Text>
              <Text
                style={styles.termsLink}
                onPress={() => setLegalType("terms")}
              >
                이용약관
              </Text>
              <Text style={styles.termsText}> 및{"\n"}</Text>
              <Text
                style={styles.termsLink}
                onPress={() => setLegalType("privacy")}
              >
                개인정보처리방침
              </Text>
              <Text style={styles.termsText}>에 동의한 것으로 간주됩니다.</Text>
            </Text>

            <View style={styles.emailLinks}>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text allowFontScaling={false} style={styles.emailLink}>
                  이메일로 로그인
                </Text>
              </TouchableOpacity>
              <Text allowFontScaling={false} style={styles.emailDivider}>
                |
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                <Text allowFontScaling={false} style={styles.emailLink}>
                  이메일로 가입
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <LegalModal
        description={TERMS_OF_SERVICE}
        open={legalType === "terms"}
        title="이용약관"
        onClose={() => setLegalType(null)}
      />
      <LegalModal
        description={PRIVACY_POLICY}
        open={legalType === "privacy"}
        title="개인정보처리방침"
        onClose={() => setLegalType(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.black,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.black,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 6,
  },
  logoArea: {
    alignItems: "center",
    marginTop: 20,
  },
  logo: {
    width: width * 0.54,
    height: Math.min(height * 0.22, 220),
  },
  buttonArea: {
    paddingHorizontal: 43,
    marginTop: 48,
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
  kakao: {
    backgroundColor: "#FEE500",
  },
  kakaoText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 15,
  },
  google: {
    backgroundColor: "#FFF",
  },
  googleText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 15,
  },
  naver: {
    backgroundColor: "#45D38E",
  },
  naverText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 15,
  },
  terms: {
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 14,
    lineHeight: 18,
  },
  termsText: {
    color: "#D7D7D7",
    fontSize: IS_SMALL ? 10 : 11,
    lineHeight: 18,
    fontWeight: "400",
  },
  termsLink: {
    color: AppColors.primaryGreen,
    textDecorationLine: "underline",
    fontSize: IS_SMALL ? 10 : 11,
    lineHeight: 18,
    fontWeight: "400",
  },
  emailLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 36,
  },
  emailLink: {
    color: "#FFF",
    fontSize: IS_SMALL ? 12 : 13,
    textDecorationLine: "underline",
  },
  emailDivider: {
    color: "#FFF",
    fontSize: IS_SMALL ? 12 : 13,
    marginHorizontal: 10,
  },
});
