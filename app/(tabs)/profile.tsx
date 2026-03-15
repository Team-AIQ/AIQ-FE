import { API_ENDPOINTS } from "@/constants/api";
import { AppColors } from "@/constants/theme";
import { clearAuthTokens } from "@/lib/auth-storage";
import { apiRequest, isApiError } from "@/lib/api-client";
import { clearSessionData, getUserProfile, saveUserProfile } from "@/lib/user-session";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    let mounted = true;

    getUserProfile().then((profile) => {
      if (!mounted || !profile) return;
      setNickname(profile.nickname);
      setEmail(profile.email);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!nickname.trim() || !email.trim()) {
      Alert.alert("입력 확인", "닉네임과 이메일을 입력해 주세요.");
      return;
    }

    if ((password || passwordConfirm) && password !== passwordConfirm) {
      Alert.alert("비밀번호 확인", "비밀번호 확인 값이 일치하지 않습니다.");
      return;
    }

    setIsSaving(true);

    try {
      await apiRequest(API_ENDPOINTS.PROFILE_UPDATE, {
        method: "PATCH",
        requireAuth: true,
        body: {
          nickname: nickname.trim(),
          email: email.trim(),
          password: password || undefined,
        },
      });

      await saveUserProfile({
        nickname: nickname.trim(),
        email: email.trim(),
      });

      Alert.alert("저장 완료", "프로필 정보가 저장되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (error) {
      if (isApiError(error)) {
        Alert.alert("저장 실패", error.message);
      } else {
        Alert.alert("저장 실패", "프로필 정보를 저장할 수 없습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await Promise.all([clearAuthTokens(), clearSessionData()]);
    router.replace("/(auth)/welcome");
  };

  const confirmWithdraw = () => {
    Alert.alert("회원탈퇴", "탈퇴하면 계정과 저장된 정보가 초기화됩니다. 계속할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "계속",
        style: "destructive",
        onPress: async () => {
          setIsWithdrawing(true);

          try {
            await apiRequest(API_ENDPOINTS.ACCOUNT_WITHDRAW, {
              method: "DELETE",
              requireAuth: true,
            });

            await Promise.all([clearAuthTokens(), clearSessionData()]);
            router.replace("/(auth)/welcome");
          } catch (error) {
            if (isApiError(error)) {
              Alert.alert("회원탈퇴 실패", error.message);
            } else {
              Alert.alert("회원탈퇴 실패", "회원탈퇴를 진행할 수 없습니다.");
            }
          } finally {
            setIsWithdrawing(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>프로필 설정</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(nickname || "U").slice(0, 1).toUpperCase()}
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임을 입력해 주세요"
              placeholderTextColor={AppColors.gray}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="이메일을 입력해 주세요"
              placeholderTextColor={AppColors.gray}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>비밀번호 변경</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="새 비밀번호"
              placeholderTextColor={AppColors.gray}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              style={styles.input}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
              placeholder="새 비밀번호를 한 번 더 입력해 주세요"
              placeholderTextColor={AppColors.gray}
            />
            <Text style={styles.helperText}>
              비밀번호 변경은 서버 스펙이 확정되면 더 정확히 연동할 수 있어요.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isSaving && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSaving || isWithdrawing}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving ? "저장 중..." : "저장"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogout}
            disabled={isSaving || isWithdrawing}
          >
            <Text style={styles.secondaryButtonText}>로그아웃</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.withdrawButton, isWithdrawing && styles.disabledButton]}
            onPress={confirmWithdraw}
            disabled={isSaving || isWithdrawing}
          >
            <Text style={styles.withdrawButtonText}>
              {isWithdrawing ? "탈퇴 처리 중..." : "회원탈퇴"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  },
  backIcon: {
    fontSize: 28,
    color: AppColors.white,
  },
  title: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: AppColors.white,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 28,
  },
  avatarText: {
    color: AppColors.white,
    fontSize: 36,
    fontWeight: "700",
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    color: AppColors.white,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: AppColors.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: AppColors.white,
    fontSize: 14,
    backgroundColor: "#111111",
  },
  helperText: {
    color: AppColors.gray,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  primaryButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
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
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: AppColors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  withdrawButton: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#B55454",
    justifyContent: "center",
    alignItems: "center",
  },
  withdrawButtonText: {
    color: "#F07C7C",
    fontSize: 15,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
