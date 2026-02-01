import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

type Product = {
  id: string;
  name: string;
  price: string;
  specs: string[];
  link: string;
  store: string;
};

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "ThinkPad T14s Gen 6 (인텔 모델)",
    price: "2,089,000원",
    specs: [
      "Intel Core Ultra 7 프로세서",
      "RAM 32GB",
      "SSD 1TB",
      "배터리 14시간",
      "무게 약 1.2kg",
    ],
    link: "https://example.com/product1",
    store: "공식 스토어",
  },
  {
    id: "2",
    name: "LG 그램 Pro 16 (2025년판)",
    price: "1,890,000원",
    specs: [
      "Intel Core i7-1365U",
      "RAM 16GB",
      "SSD 512GB",
      "배터리 22시간",
      "무게 약 1.19kg",
    ],
    link: "https://example.com/product2",
    store: "LG전자",
  },
  {
    id: "3",
    name: "MacBook Air M3 (2024)",
    price: "1,690,000원",
    specs: [
      "Apple M3 칩",
      "RAM 16GB",
      "SSD 256GB",
      "배터리 18시간",
      "무게 약 1.24kg",
    ],
    link: "https://example.com/product3",
    store: "Apple",
  },
];

export default function ReportDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const provider = params.provider as string;

  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const handleProductPress = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

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

  const getProviderName = () => {
    switch (provider) {
      case "chatgpt":
        return "Chat GPT";
      case "gemini":
        return "Gemini";
      case "perplexity":
        return "Perplexity";
      default:
        return "AI";
    }
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
          <Text style={styles.headerTitle}>{getProviderName()} 리포트</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 요약 */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>📊 분석 요약</Text>
            <Text style={styles.summaryText}>
              2000만원대 노트북 중에서 성능, 휴대성, 배터리 수명을 고려한 TOP 3
              제품을 선정했습니다. 각 제품은 업무용으로 적합하며, 가성비가
              뛰어난 제품들입니다.
            </Text>
          </View>

          {/* TOP 3 제품 */}
          <Text style={styles.sectionTitle}>TOP 3 추천 제품</Text>

          {MOCK_PRODUCTS.map((product, index) => (
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

              {/* 스펙 */}
              <View style={styles.specsList}>
                {product.specs.map((spec, idx) => (
                  <Text key={idx} style={styles.specItem}>
                    • {spec}
                  </Text>
                ))}
              </View>

              {/* 구매 링크 */}
              <View style={styles.productFooter}>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => handleLinkPress(product.link)}
                >
                  <Text style={styles.linkButtonText}>
                    {product.store}에서 보기 →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* 추가 정보 */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 구매 팁</Text>
            <Text style={styles.infoText}>
              • 카드 할인 및 무이자 혜택을 확인하세요{"\n"}• 학생/교직원 할인이
              가능한지 확인해보세요{"\n"}• 보증 기간과 A/S 정책을 꼭
              확인하세요
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.buttonArea}>
          <TouchableOpacity
            style={styles.compareButton}
            onPress={() => router.push("/(tabs)/report-select")}
          >
            <Text style={styles.compareButtonText}>다른 리포트 비교하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.askButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.askButtonText}>이어서 질문하기</Text>
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
    paddingBottom: 140,
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
  productFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  linkButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(63, 221, 144, 0.1)",
    borderRadius: 8,
    alignItems: "center",
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primaryGreen,
  },
  infoBox: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.white,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.gray,
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 20,
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
  compareButton: {
    width: "100%",
    height: 48,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  compareButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primaryGreen,
  },
  askButton: {
    width: "100%",
    height: 52,
    backgroundColor: AppColors.primaryGreen,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  askButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.black,
  },
});
