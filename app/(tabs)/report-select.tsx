import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

type AIProvider = "chatgpt" | "gemini" | "perplexity";

type ReportCard = {
  id: AIProvider;
  name: string;
  title: string;
  summary: string;
  topProducts: string[];
};

const MOCK_REPORTS: ReportCard[] = [
  {
    id: "chatgpt",
    name: "Chat GPT",
    title: "1. ThinkPad T14s Gen 6 (인텔 모델)",
    summary:
      "- 최신 인텔 Core Ultra 7 프로세서 탑재\n- RAM 32GB / 스토리지 1TB\n- 배터리 14시간 / 경량 약 1.2kg",
    topProducts: ["제품1", "제품2", "제품3"],
  },
  {
    id: "gemini",
    name: "Gemini",
    title: "2. LG 그램 Pro 16 (2025년판)",
    summary:
      "- 인텔 Core i7-1365U 프로세서\n- RAM 16GB / 스토리지 512GB SSD\n- 배터리 최대 22시간 / 무게 약 1.19kg",
    topProducts: ["제품1", "제품2", "제품3"],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    title: "3. MacBook Air M3 (2024 기준)",
    summary:
      "- Apple M3 칩\n- RAM 16GB / 스토리지 256GB\n- 배터리 최대 18시간 / 무게 약 1.24kg",
    topProducts: ["제품1", "제품2", "제품3"],
  },
];

export default function ReportSelectScreen() {
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState<AIProvider | null>(
    null
  );

  const handleSelectReport = (id: AIProvider) => {
    setSelectedReport(id);
  };

  const handleViewDetail = () => {
    if (!selectedReport) return;
    router.push({
      pathname: "/(tabs)/report-detail",
      params: { provider: selectedReport },
    });
  };

  const handleAskMore = () => {
    router.push("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>리포트 선택</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 안내 메시지 */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 각 AI가 추천하는 제품을 확인하고{"\n"}마음에 드는 리포트를
              선택하세요!
            </Text>
          </View>

          {/* 리포트 카드들 */}
          {MOCK_REPORTS.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={[
                styles.reportCard,
                selectedReport === report.id && styles.reportCardSelected,
              ]}
              onPress={() => handleSelectReport(report.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardProvider}>{report.name}</Text>
                {selectedReport === report.id && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardTitle}>{report.title}</Text>

              <Text style={styles.cardSummary}>{report.summary}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>
                  TOP 3 제품 포함 • 상세 비교 분석
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.buttonArea}>
          {selectedReport && (
            <TouchableOpacity
              style={styles.detailButton}
              onPress={handleViewDetail}
            >
              <Text style={styles.detailButtonText}>상세 리포트 보기</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.askButton,
              selectedReport && styles.askButtonSecondary,
            ]}
            onPress={handleAskMore}
          >
            <Text
              style={[
                styles.askButtonText,
                selectedReport && styles.askButtonTextSecondary,
              ]}
            >
              이어서 질문받기
            </Text>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 24,
    color: AppColors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.white,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  infoBox: {
    backgroundColor: "rgba(63, 221, 144, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.white,
    lineHeight: 22,
  },
  reportCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  reportCardSelected: {
    borderColor: AppColors.primaryGreen,
    backgroundColor: "rgba(63, 221, 144, 0.05)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardProvider: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.primaryGreen,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
  },
  checkIcon: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.black,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white,
    marginBottom: 12,
  },
  cardSummary: {
    fontSize: 14,
    color: AppColors.gray,
    lineHeight: 22,
    marginBottom: 16,
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  footerText: {
    fontSize: 12,
    color: AppColors.gray,
  },
  buttonArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: AppColors.black,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  detailButton: {
    width: "100%",
    height: 52,
    backgroundColor: AppColors.primaryGreen,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  detailButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.black,
  },
  askButton: {
    width: "100%",
    height: 52,
    backgroundColor: AppColors.primaryGreen,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  askButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: AppColors.white,
  },
  askButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.black,
  },
  askButtonTextSecondary: {
    color: AppColors.white,
  },
});
