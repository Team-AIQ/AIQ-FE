import { AppColors } from "@/constants/theme";
import { getReportSession } from "@/lib/report-session";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReportLoadingScreen() {
  const router = useRouter();
  const [loadingStep, setLoadingStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [reportTitle, setReportTitle] = useState("리포트");
  const fadeAnim1 = useRef(new Animated.Value(0.3)).current;
  const fadeAnim2 = useRef(new Animated.Value(0.3)).current;
  const fadeAnim3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    let mounted = true;

    getReportSession().then((session) => {
      if (!mounted || !session) return;
      setReportTitle(session.categoryName);
    });

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= 2) {
          clearInterval(stepInterval);
          setIsComplete(true);
          return prev;
        }

        return prev + 1;
      });
    }, 1400);

    const sequence = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim1, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim2, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim3, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(fadeAnim1, {
            toValue: 0.3,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim2, {
            toValue: 0.3,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim3, {
            toValue: 0.3,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    sequence.start();

    return () => {
      mounted = false;
      clearInterval(stepInterval);
      sequence.stop();
    };
  }, [fadeAnim1, fadeAnim2, fadeAnim3]);

  const getLoadingMessage = () => {
    switch (loadingStep) {
      case 0:
        return `${reportTitle} 조건 정리 중`;
      case 1:
        return "AI 리포트 생성 중";
      case 2:
        return "리포트 생성 완료";
      default:
        return "리포트 준비 중";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.loadingArea}>
          <Text style={styles.loadingTitle}>{getLoadingMessage()}</Text>

          <View style={styles.loadingDots}>
            <Animated.View style={[styles.dot, { opacity: fadeAnim1 }]} />
            <Animated.View style={[styles.dot, { opacity: fadeAnim2 }]} />
            <Animated.View style={[styles.dot, { opacity: fadeAnim3 }]} />
          </View>

          <Text style={styles.loadingSubtext}>
            {loadingStep === 0
              ? "질문과 응답을 바탕으로 조건을 정리하고 있어요."
              : loadingStep === 1
                ? "세 가지 AI 관점으로 추천 리포트를 만들고 있어요."
                : "리포트가 준비됐어요."}
          </Text>
        </View>

        {isComplete ? (
          <View style={styles.buttonArea}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => router.push("/(tabs)/report-select")}
            >
              <Text style={styles.viewButtonText}>리포트 결과 확인하기</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
    paddingHorizontal: 28,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: AppColors.white,
    marginBottom: 40,
    textAlign: "center",
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
    textAlign: "center",
    lineHeight: 22,
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
