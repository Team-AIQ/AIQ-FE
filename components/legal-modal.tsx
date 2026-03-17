import { AppColors } from "@/constants/theme";
import {
  Dimensions,
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

const { height } = Dimensions.get("window");
const IS_SMALL = height < 740;

function isSectionHeader(line: string) {
  return /^\d+\./.test(line) || /^제\d+조/.test(line);
}

function renderDescription(description: string) {
  return description
    .trim()
    .split("\n\n")
    .map((block, index) => {
      const lines = block.split("\n").filter(Boolean);
      const [firstLine, ...restLines] = lines;
      const section = isSectionHeader(firstLine);

      return (
        <View key={`${firstLine}-${index}`} style={styles.section}>
          {section ? (
            <>
              <Text allowFontScaling={false} style={styles.sectionTitle}>
                {firstLine}
              </Text>
              <View style={styles.divider} />
              {restLines.map((line, lineIndex) => {
                const bullet = line.trim().startsWith("- ");
                return (
                  <Text
                    key={`${line}-${lineIndex}`}
                    allowFontScaling={false}
                    style={bullet ? styles.bullet : styles.paragraph}
                  >
                    {line}
                  </Text>
                );
              })}
            </>
          ) : (
            lines.map((line, lineIndex) => {
              const bullet = line.trim().startsWith("- ");
              return (
                <Text
                  key={`${line}-${lineIndex}`}
                  allowFontScaling={false}
                  style={bullet ? styles.bullet : styles.paragraph}
                >
                  {line}
                </Text>
              );
            })
          )}
        </View>
      );
    });
}

export function LegalModal({
  description,
  open,
  title,
  onClose,
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
            <Text allowFontScaling={false} style={styles.title}>
              {title}
            </Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text allowFontScaling={false} style={styles.closeText}>
                X
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator
          >
            {renderDescription(description)}
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
    fontSize: IS_SMALL ? 18 : 20,
    fontWeight: "800",
    paddingRight: 12,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.55)",
    backgroundColor: "rgba(6, 10, 9, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: AppColors.primaryGreen,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 18,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(63, 221, 144, 0.22)",
    marginBottom: 12,
  },
  sectionTitle: {
    color: AppColors.white,
    fontSize: IS_SMALL ? 16 : 17,
    fontWeight: "700",
    lineHeight: 24,
    marginBottom: 10,
  },
  paragraph: {
    color: AppColors.white,
    fontSize: IS_SMALL ? 13 : 14,
    lineHeight: IS_SMALL ? 22 : 24,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  bullet: {
    color: "#D8D8D8",
    fontSize: IS_SMALL ? 13 : 14,
    lineHeight: IS_SMALL ? 22 : 24,
    letterSpacing: -0.2,
    paddingLeft: 6,
    marginBottom: 6,
  },
});
