import { AppColors } from "@/constants/theme";
import { AIProvider, getReportSession, ProviderReport } from "@/lib/report-session";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReportSelectScreen() {
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState<AIProvider | null>(null);
  const [reports, setReports] = useState<ProviderReport[]>([]);
  const [summary, setSummary] = useState("");

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      getReportSession().then((session) => {
        if (!mounted || !session) return;
        setReports(session.providers);
        setSummary(session.summary);
        setSelectedReport((current) => current ?? session.providers[0]?.provider ?? null);
      });

      return () => {
        mounted = false;
      };
    }, []),
  );

  const handleViewDetail = () => {
    if (!selectedReport) return;

    router.push({
      pathname: "/(tabs)/report-detail",
      params: { provider: selectedReport },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>리포트 선택</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>요약</Text>
            <Text style={styles.infoText}>{summary}</Text>
          </View>

          {reports.map((report) => (
            <TouchableOpacity
              key={report.provider}
              style={[
                styles.reportCard,
                selectedReport === report.provider && styles.reportCardSelected,
              ]}
              onPress={() => setSelectedReport(report.provider)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardProvider}>{report.providerLabel}</Text>
                {selectedReport === report.provider ? (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.cardTitle}>{report.headline}</Text>
              <Text style={styles.cardSummary}>{report.summary}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.buttonArea}>
          <TouchableOpacity style={styles.detailButton} onPress={handleViewDetail}>
            <Text style={styles.detailButtonText}>상세 리포트 보기</Text>
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
  infoTitle: {
    color: AppColors.primaryGreen,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
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
    fontWeight: "700",
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
  },
  buttonArea: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: AppColors.black,
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
    color: AppColors.black,
    fontSize: 16,
    fontWeight: "700",
  },
});
