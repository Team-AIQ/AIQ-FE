import { AppColors } from "@/constants/theme";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type LegalModalProps = {
  description: string;
  open: boolean;
  title: string;
  onClose: () => void;
};

export function LegalModal({
  description,
  open,
  title,
  onClose,
}: LegalModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={open}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>닫기</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.body}>{description}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: "72%",
    backgroundColor: AppColors.black,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.35)",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  close: {
    color: AppColors.primaryGreen,
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    paddingBottom: 8,
  },
  body: {
    color: AppColors.lightGray,
    fontSize: 13,
    lineHeight: 22,
  },
});
