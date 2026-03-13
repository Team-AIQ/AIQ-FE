import { AppColors } from "@/constants/theme";
import {
  AIProviderSettings,
  ChatHistoryItem,
  UserProfile,
} from "@/lib/user-session";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type MenuDrawerProps = {
  open: boolean;
  profile: UserProfile | null;
  credits: number;
  history: ChatHistoryItem[];
  settings: AIProviderSettings;
  onClose: () => void;
  onToggleProvider: (key: keyof AIProviderSettings, value: boolean) => void;
  onOpenHelp: () => void;
  onOpenCredits: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onWithdraw: () => void;
};

export function MenuDrawer({
  open,
  profile,
  credits,
  history,
  settings,
  onClose,
  onToggleProvider,
  onOpenHelp,
  onOpenCredits,
  onEditProfile,
  onLogout,
  onWithdraw,
}: MenuDrawerProps) {
  return (
    <Modal animationType="fade" transparent visible={open} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpButton} onPress={onOpenHelp}>
              <Text style={styles.helpButtonText}>도움말</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.profileCard} onPress={onEditProfile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.nickname?.slice(0, 1).toUpperCase() || "U"}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.nickname}>{profile?.nickname || "유저 닉네임"}</Text>
              <Text style={styles.email}>{profile?.email || "aiq@email.com"}</Text>
            </View>
            <Text style={styles.editLink}>수정</Text>
          </TouchableOpacity>

          <View style={styles.creditRow}>
            <View>
              <Text style={styles.sectionTitle}>크레딧</Text>
              <Text style={styles.creditValue}>{credits} credits</Text>
            </View>
            <TouchableOpacity style={styles.creditButton} onPress={onOpenCredits}>
              <Text style={styles.creditButtonText}>광고로 충전</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>최근 채팅</Text>
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {history.length === 0 ? (
              <Text style={styles.emptyText}>아직 저장된 대화가 없습니다.</Text>
            ) : (
              history.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <Text style={styles.historyText} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          <Text style={styles.sectionTitle}>AI 응답 설정</Text>
          <View style={styles.toggleGroup}>
            {(["chatgpt", "gemini", "perplexity"] as Array<keyof AIProviderSettings>).map(
              (key) => (
                <View key={key} style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    {key === "chatgpt"
                      ? "Chat GPT"
                      : key === "gemini"
                        ? "Gemini"
                        : "Perplexity"}
                  </Text>
                  <Switch
                    value={settings[key]}
                    onValueChange={(value) => onToggleProvider(key, value)}
                    trackColor={{ false: "#555", true: AppColors.primaryGreen }}
                    thumbColor={AppColors.white}
                  />
                </View>
              ),
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton} onPress={onLogout}>
              <Text style={styles.footerButtonText}>로그아웃</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.withdrawButton]}
              onPress={onWithdraw}
            >
              <Text style={styles.footerButtonText}>회원탈퇴</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    width: "76%",
    backgroundColor: "#262626",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  closeIcon: {
    color: AppColors.white,
    fontSize: 24,
  },
  helpButton: {
    borderWidth: 1,
    borderColor: AppColors.primaryGreen,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  helpButtonText: {
    color: AppColors.primaryGreen,
    fontSize: 12,
    fontWeight: "600",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: AppColors.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: AppColors.white,
    fontSize: 20,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  nickname: {
    color: AppColors.white,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  email: {
    color: AppColors.gray,
    fontSize: 12,
  },
  editLink: {
    color: AppColors.primaryGreen,
    fontSize: 12,
    fontWeight: "600",
  },
  creditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  sectionTitle: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  creditValue: {
    color: AppColors.primaryGreen,
    fontSize: 18,
    fontWeight: "700",
  },
  creditButton: {
    borderRadius: 999,
    backgroundColor: AppColors.black,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  creditButtonText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  historyList: {
    maxHeight: 250,
    marginBottom: 18,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingVertical: 10,
  },
  historyText: {
    color: AppColors.white,
    fontSize: 12,
    marginBottom: 4,
  },
  historyDate: {
    color: AppColors.gray,
    fontSize: 11,
  },
  emptyText: {
    color: AppColors.gray,
    fontSize: 12,
    paddingVertical: 8,
  },
  toggleGroup: {
    marginBottom: 18,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  toggleLabel: {
    color: AppColors.white,
    fontSize: 13,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  footerButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.white,
    paddingVertical: 12,
    alignItems: "center",
  },
  withdrawButton: {
    borderColor: "#B55454",
  },
  footerButtonText: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: "600",
  },
});
