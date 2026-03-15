import { AppColors } from "@/constants/theme";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type LegalModalProps = {
  description: string;
  open: boolean;
  title: string;
  onClose: () => void;
};

function renderParagraphs(description: string) {
  return description
    .trim()
    .split("\n\n")
    .map((block, index) => {
      const lines = block.split("\n").filter(Boolean);
      const [firstLine, ...restLines] = lines;
      const isSectionTitle =
        /^\d+\./.test(firstLine) || /^제\d+조/.test(firstLine);

      if (isSectionTitle) {
        return (
          <View key={`${firstLine}-${index}`} style={styles.section}>
            <Text style={styles.sectionTitle}>{firstLine}</Text>
            {restLines.map((line, lineIndex) => {
              const isBullet = line.trim().startsWith("- ");
              return (
                <Text
                  key={`${line}-${lineIndex}`}
                  style={isBullet ? styles.bullet : styles.paragraph}
                >
                  {line}
                </Text>
              );
            })}
          </View>
        );
      }

      return (
        <View key={`${firstLine}-${index}`} style={styles.section}>
          {lines.map((line, lineIndex) => {
            const isBullet = line.trim().startsWith("- ");
            return (
              <Text
                key={`${line}-${lineIndex}`}
                style={isBullet ? styles.bullet : styles.paragraph}
              >
                {line}
              </Text>
            );
          })}
        </View>
      );
    });
}

export function LegalModal({
  description,
  open,
  onClose,
  title,
}: LegalModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={open}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator
          >
            {renderParagraphs(description)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.74)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "72%",
    backgroundColor: "#050607",
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(63, 221, 144, 0.45)",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: AppColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: {
    flex: 1,
    color: AppColors.primaryGreen,
    fontSize: 20,
    fontWeight: "800",
    paddingRight: 12,
  },
  closeButton: {
    minWidth: 52,
    alignItems: "flex-end",
  },
  closeText: {
    color: AppColors.primaryGreen,
    fontSize: 15,
    fontWeight: "700",
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingBottom: 10,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: AppColors.white,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 24,
    marginBottom: 10,
  },
  paragraph: {
    color: AppColors.white,
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  bullet: {
    color: "#D8D8D8",
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: -0.2,
    paddingLeft: 6,
    marginBottom: 6,
  },
});
