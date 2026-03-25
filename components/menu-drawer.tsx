import StarfieldBackground from "@/components/starfield-background";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
  onSelectHistory?: (item: ChatHistoryItem) => void;
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
  onSelectHistory,
}: MenuDrawerProps) {
  const insets = useSafeAreaInsets();
  const resolvedTopInset = insets.top > 0 ? insets.top : 44;
  const topInsetPadding = Math.max(24, resolvedTopInset + 6);
  const getSectionLabel = (dateValue: string) => {
    const date = new Date(dateValue);
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const startOfItem = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const diffDays = Math.floor(
      (startOfToday.getTime() - startOfItem.getTime()) / 86400000,
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return "이전";
  };

  const groupedHistory = history.reduce<Record<string, ChatHistoryItem[]>>(
    (acc, item) => {
      const label = getSectionLabel(item.createdAt);
      acc[label] = acc[label] ? [...acc[label], item] : [item];
      return acc;
    },
    {},
  );

  const sectionOrder = ["Today", "Yesterday", "이전"].filter(
    (label) => groupedHistory[label]?.length,
  );
  return (
    <Modal
      animationType="fade"
      transparent
      visible={open}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.panel, styles.panelRounded]}>
          <View style={styles.starLayer}>
            <StarfieldBackground density={0.00016} maxOpacity={0.55} />
          </View>
          <SafeAreaView
            style={[styles.panelContent, { paddingTop: topInsetPadding }]}
            edges={["top"]}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.helpButton} onPress={onOpenHelp}>
                <Text style={styles.helpButtonText}>도움말</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.profileCard, styles.profileCardSurface]}
              onPress={onEditProfile}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.nickname?.slice(0, 1).toUpperCase() || "U"}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.nickname}>
                  {profile?.nickname || "사용자"}
                </Text>
                <Text style={styles.email}>
                  {profile?.email || "aiq@email.com"}
                </Text>
              </View>
              <Text style={styles.editLink}>수정</Text>
            </TouchableOpacity>

            <View style={[styles.creditRow, styles.creditRowEmphasis]}>
              <View>
                <Text style={styles.sectionTitle}>크레딧</Text>
                <Text style={styles.creditValue}>{credits} credits</Text>
              </View>
              <TouchableOpacity
                style={[styles.creditButton, styles.creditButtonEmphasis]}
                onPress={onOpenCredits}
              >
                <Text style={styles.creditButtonText}>광고보기 (2c)</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>최근 채팅</Text>
            <ScrollView
              style={[styles.historyList, styles.historyListTight]}
              showsVerticalScrollIndicator={false}
            >
              {history.length === 0 ? (
                <Text style={styles.emptyText}>
                  아직 저장된 대화가 없습니다.
                </Text>
              ) : (
                sectionOrder.map((label) => (
                  <View key={label} style={styles.historySection}>
                    <Text style={styles.historySectionLabel}>{label}</Text>
                    {groupedHistory[label].map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.historyItem, styles.historyItemCard]}
                        activeOpacity={0.7}
                        onPress={() => onSelectHistory?.(item)}
                      >
                        <Text style={styles.historyText} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.historyDate}>
                          {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>

            <Text style={[styles.sectionTitle, styles.aiSectionTitle]}>
              AI 응답 설정
            </Text>
            <View style={[styles.toggleGroup, styles.toggleGroupSpaced]}>
              {(
                ["chatgpt", "gemini", "perplexity"] as Array<
                  keyof AIProviderSettings
                >
              ).map((key) => (
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
              ))}
            </View>
          </SafeAreaView>
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
    backgroundColor: "rgba(18, 18, 18, 0.95)",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(63, 221, 144, 0.2)",
  },
  starLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  panelContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 24,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
    marginBottom: 16,
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
    marginBottom: 16,
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
    marginBottom: 16,
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
    marginBottom: 16,
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
  panelRounded: {
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  profileCardSurface: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  creditRowEmphasis: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.35)",
    backgroundColor: "rgba(8, 16, 12, 0.7)",
  },
  creditButtonEmphasis: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.35)",
  },
  historyListTight: {
    maxHeight: 260,
    marginBottom: 20,
  },
  historySection: {
    marginBottom: 10,
  },
  historySectionLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  historyItemCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  aiSectionTitle: {
    marginTop: 6,
  },
  toggleGroupSpaced: {
    marginTop: 8,
    marginBottom: 22,
  },
});

