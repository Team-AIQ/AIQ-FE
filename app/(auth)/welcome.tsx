import { LegalModal } from "@/components/legal-modal";
import { API_BASE_URL } from "@/constants/api";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/constants/legal";
import { AppColors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const OAUTH_URLS = {
  kakao: `${API_BASE_URL}/oauth2/authorization/kakao?origin=app`,
  google: `${API_BASE_URL}/oauth2/authorization/google?origin=app`,
  naver: `${API_BASE_URL}/oauth2/authorization/naver?origin=app`,
};

const REDIRECT_URL =
  process.env.EXPO_PUBLIC_REDIRECT_URL || "exp://localhost:8081";

type LegalType = "privacy" | "terms" | null;

export default function WelcomeScreen() {
  const router = useRouter();
  const [legalType, setLegalType] = useState<LegalType>(null);

  const handleOAuthLogin = async (provider: "kakao" | "google" | "naver") => {
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        OAUTH_URLS[provider],
        REDIRECT_URL,
      );

      if (result.type !== "success") {
        Alert.alert("로그인 취소", "소셜 로그인이 취소되었습니다.");
      }
    } catch (error) {
      console.error("OAuth Error:", error);
      Alert.alert("로그인 오류", "로그인 중 문제가 발생했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
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
          >
            <Image
              source={require("../../assets/images/kakao.png")}
              style={styles.kakaoIcon}
              resizeMode="contain"
            />
            <Text style={styles.kakaoText}>카카오로 계속하기</Text>
          </TouchableOpacity>

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

          <Text style={styles.terms}>
            <Text style={styles.termsGray}>
              회원가입 없이 이용 가능하며 로그인 시{" "}
            </Text>
            <Pressable onPress={() => setLegalType("terms")}>
              <Text style={styles.termsGreen}>이용약관</Text>
            </Pressable>
            <Text style={styles.termsGray}> 및 </Text>
            <Pressable onPress={() => setLegalType("privacy")}>
              <Text style={styles.termsGreen}>개인정보처리방침</Text>
            </Pressable>
            <Text style={styles.termsGray}>에 동의한 것으로 간주됩니다.</Text>
          </Text>

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
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  logoArea: {
    alignItems: "center",
    marginTop: 80,
  },
  logo: {
    width: width * 3,
    height: width * 0.9,
  },
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
    lineHeight: 18,
  },
  termsGray: {
    color: "#CACACA",
  },
  termsGreen: {
    color: AppColors.primaryGreen,
    textDecorationLine: "underline",
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
