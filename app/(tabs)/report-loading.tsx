import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

export default function ReportLoadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loadingStep, setLoadingStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // 로딩 애니메이션
  const fadeAnim1 = new Animated.Value(0.3);
  const fadeAnim2 = new Animated.Value(0.3);
  const fadeAnim3 = new Animated.Value(0.3);

  useEffect(() => {
    // 로딩 단계별 메시지 변경
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= 2) {
          clearInterval(stepInterval);
          setIsComplete(true);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    // 로딩 애니메이션
    const sequence = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim1, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim2, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim3, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(fadeAnim1, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim2, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim3, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    sequence.start();

    return () => {
      clearInterval(stepInterval);
      sequence.stop();
    };
  }, []);

  const getLoadingMessage = () => {
    switch (loadingStep) {
      case 0:
        return "리포트 준비중";
      case 1:
        return "리포트 생성 중";
      case 2:
        return "리포트 생성 완료";
      default:
        return "리포트 준비중";
    }
  };

  const handleViewReport = () => {
    router.push("/(tabs)/report-select");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        {/* 뒤로가기 버튼 */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* 로딩 영역 */}
        <View style={styles.loadingArea}>
          <Text style={styles.loadingTitle}>{getLoadingMessage()}</Text>

          <View style={styles.loadingDots}>
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: fadeAnim1,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: fadeAnim2,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: fadeAnim3,
                },
              ]}
            />
          </View>

          {loadingStep === 0 && (
            <Text style={styles.loadingSubtext}>
              리포트를 생성 중입니다...
            </Text>
          )}
          {loadingStep === 1 && (
            <Text style={styles.loadingSubtext}>
              여러 AI가 제품을 분석하고 있습니다...
            </Text>
          )}
          {loadingStep === 2 && (
            <Text style={styles.loadingSubtext}>
              리포트가 준비되었습니다!
            </Text>
          )}
        </View>

        {/* 하단 버튼 */}
        {isComplete && (
          <View style={styles.buttonArea}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={handleViewReport}
            >
              <Text style={styles.viewButtonText}>
                리포트 결과를 확인해 주세요
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  backIcon: {
    fontSize: 28,
    color: AppColors.white,
  },
  loadingArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: AppColors.white,
    marginBottom: 40,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.primaryGreen,
  },
  loadingSubtext: {
    fontSize: 14,
    color: AppColors.gray,
  },
  buttonArea: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  viewButton: {
    width: "100%",
    height: 52,
    backgroundColor: AppColors.primaryGreen,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.black,
  },
});
