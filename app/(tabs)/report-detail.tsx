import { AppColors } from "@/constants/theme";
import { getReportSession, ProviderReport, ReportProduct } from "@/lib/report-session";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReportDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ provider?: string }>();
  const [report, setReport] = useState<ProviderReport | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      getReportSession().then((session) => {
        if (!mounted || !session) return;
        const selectedReport =
          session.providers.find((item) => item.provider === params.provider) ?? null;
        setReport(selectedReport);
      });

      return () => {
        mounted = false;
      };
    }, [params.provider]),
  );

  const products = useMemo<ReportProduct[]>(() => report?.products ?? [], [report]);

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("링크 열기 실패:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {report ? `${report.providerLabel} 리포트` : "리포트"}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>
              {report?.headline || "추천 리포트 요약"}
            </Text>
            <Text style={styles.summaryText}>
              {report?.summary || "리포트를 불러오는 중입니다."}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>TOP 3 추천 제품</Text>

          {products.map((product, index) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>{product.price}</Text>
                </View>
              </View>

              <View style={styles.specsList}>
                {product.specs.map((spec) => (
                  <Text key={`${product.id}-${spec}`} style={styles.specItem}>
                    • {spec}
                  </Text>
                ))}
              </View>

              <View style={styles.reasonBox}>
                <Text style={styles.reasonTitle}>추천 이유</Text>
                <Text style={styles.reasonText}>{product.reason}</Text>
              </View>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => handleLinkPress(product.link)}
              >
                <Text style={styles.linkButtonText}>{product.store}에서 보기</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.buttonArea}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.completeButtonText}>완료하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.askButton}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/report-chat-options",
                params: { provider: params.provider ?? "" },
              })
            }
          >
            <Text style={styles.askButtonText}>대화하기</Text>
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
    paddingBottom: 160,
  },
  summaryBox: {
    backgroundColor: "rgba(63, 221, 144, 0.1)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: AppColors.white,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.white,
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.black,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white,
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.primaryGreen,
  },
  specsList: {
    marginBottom: 16,
  },
  specItem: {
    fontSize: 14,
    color: AppColors.gray,
    lineHeight: 24,
  },
  reasonBox: {
    backgroundColor: "rgba(63, 221, 144, 0.08)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  reasonTitle: {
    color: AppColors.primaryGreen,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  reasonText: {
    color: AppColors.white,
    fontSize: 14,
    lineHeight: 22,
  },
  linkButton: {
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
  },
  linkButtonText: {
    color: AppColors.primaryGreen,
    fontSize: 14,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 24,
  },
  buttonArea: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: AppColors.black,
  },
  completeButton: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    backgroundColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
  },
  completeButtonText: {
    color: AppColors.black,
    fontSize: 16,
    fontWeight: "700",
  },
  askButton: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  askButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
