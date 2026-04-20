import { AppColors } from "@/constants/theme";
import { AIProvider } from "@/lib/report-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReportChatOptionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ provider?: string }>();

  const providerLabel =
    params.provider === "gemini"
      ? "Gemini"
      : params.provider === "perplexity"
        ? "Perplexity"
        : "Chat GPT";

  const provider = (params.provider || "chatgpt") as AIProvider;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.panel}>
          <Text style={styles.title}>추가로 어떤 대화를 이어갈까요?</Text>
          <Text style={styles.description}>
            현재 선택한 리포트는 {providerLabel} 기준입니다. 비교 관점을 더 넓히거나,
            지금 조건으로 바로 후속 질문을 이어갈 수 있습니다.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/(tabs)/report-select")}
          >
            <Text style={styles.primaryButtonText}>비교군 3개로 확장</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: "/(tabs)",
                params: { continue: "1", provider },
              })
            }
          >
            <Text style={styles.secondaryButtonText}>이어서 질문하기</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 20,
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: AppColors.white,
  },
  panel: {
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.3)",
    borderRadius: 18,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  title: {
    color: AppColors.white,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  description: {
    color: AppColors.lightGray,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: AppColors.black,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
