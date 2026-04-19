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
  onAgree?: () => void;
};

type LineKind = "section" | "question" | "accent" | "body";

const getLineKind = (line: string): LineKind => {
  const text = line
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .trim();

  if (!text) {
    return "body";
  }

  if (/^제\s*\d+조/.test(text) || /^\d+\./.test(text)) {
    return "section";
  }

  if (/^[\-•·]?\s*Q\s*\d+[\.)]/i.test(text)) {
    return "question";
  }

  if (/^-\s*[^:]+\s*:/.test(text)) {
    return "accent";
  }

  return "body";
};

export function LegalModal({
  description,
  open,
  title,
  onClose,
  onAgree,
}: LegalModalProps) {
  const lines = description.split("\n");

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
              <Text style={styles.closeText}>X</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator
          >
            <View>
              {lines.map((line, index) => {
                const cleaned = line
                  .replace(/\u200B/g, "")
                  .replace(/\r/g, "")
                  .trim();
                const lineKind = getLineKind(line);

                if (!cleaned) {
                  return (
                    <View key={`space-${index}`} style={styles.emptyLine} />
                  );
                }

                if (lineKind === "section") {
                  return (
                    <View key={`section-${index}`} style={styles.sectionWrap}>
                      <Text style={styles.sectionText}>{cleaned}</Text>
                      <View style={styles.sectionDivider} />
                    </View>
                  );
                }

                if (lineKind === "accent") {
                  return (
                    <View key={`accent-${index}`} style={styles.accentWrap}>
                      <Text style={styles.accentText}>{cleaned}</Text>
                    </View>
                  );
                }

                if (lineKind === "question") {
                  return (
                    <View key={`question-${index}`} style={styles.questionWrap}>
                      <Text style={styles.questionText}>{cleaned}</Text>
                    </View>
                  );
                }

                return (
                  <View key={`body-${index}`} style={styles.bodyWrap}>
                    <Text style={styles.body}>{cleaned}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {onAgree ? (
            <Pressable style={styles.agreeButton} onPress={onAgree}>
              <Text style={styles.agreeButtonText}>동의</Text>
            </Pressable>
          ) : null}
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
    marginBottom: 16,
  },
  title: {
    flex: 1,
    color: AppColors.primaryGreen,
    fontSize: 22,
    fontWeight: "800",
    paddingRight: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "rgba(63, 221, 144, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(63, 221, 144, 0.08)",
  },
  closeText: {
    color: "#42FFB4",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 30,
    marginTop: -1,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingBottom: 10,
  },
  emptyLine: {
    height: 16,
  },
  sectionWrap: {
    marginTop: 6,
    marginBottom: 18,
  },
  sectionText: {
    color: AppColors.white,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
    marginBottom: 14,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(63, 221, 144, 0.55)",
  },
  accentWrap: {
    marginTop: 10,
    marginBottom: 8,
  },
  accentText: {
    color: AppColors.primaryGreen,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 26,
  },
  questionWrap: {
    marginTop: 10,
    marginBottom: 8,
  },
  questionText: {
    color: AppColors.primaryGreen,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 26,
  },
  bodyWrap: {
    marginBottom: 10,
  },
  body: {
    color: AppColors.white,
    fontSize: 15,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  agreeButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 10,
    backgroundColor: AppColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
  },
  agreeButtonText: {
    color: AppColors.black,
    fontSize: 15,
    fontWeight: "700",
  },
});
