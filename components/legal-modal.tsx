import { AppColors } from "@/constants/theme";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Linking,
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
  agreeLabel?: string;
};

const { height } = Dimensions.get("window");
const IS_SMALL = height < 740;

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function isSectionHeader(line: string) {
  return /^\d+\./.test(line.trim());
}

function isQuestionLine(line: string) {
  return /^Q\d+\./i.test(line.trim());
}

function renderLineWithLinks(line: string, style: any, key: string) {
  const parts = line.split(URL_PATTERN).filter(Boolean);
  if (parts.length <= 1) {
    return (
      <Text key={key} allowFontScaling={false} style={style}>
        {line}
      </Text>
    );
  }

  return (
    <Text key={key} allowFontScaling={false} style={style}>
      {parts.map((part, index) => {
        const isUrl = part.startsWith("http://") || part.startsWith("https://");
        if (!isUrl) return <Text key={`${key}-t-${index}`}>{part}</Text>;
        return (
          <Text
            key={`${key}-u-${index}`}
            style={styles.link}
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

function renderDescription(description: string) {
  return description
    .trim()
    .split("\n\n")
    .map((block, index) => {
      const lines = block.split("\n").filter(Boolean);
      const [firstLine, ...restLines] = lines;
      const section = isSectionHeader(firstLine);

      const renderLine = (line: string, lineIndex: number) => {
        const bullet = line.trim().startsWith("- ");
        const question = isQuestionLine(line);
        const style = [
          bullet ? styles.bullet : styles.paragraph,
          question ? styles.question : null,
        ];
        return renderLineWithLinks(line, style, `${line}-${lineIndex}-${index}`);
      };

      return (
        <View key={`${firstLine}-${index}`} style={styles.section}>
          {section ? (
            <>
              <Text allowFontScaling={false} style={styles.sectionTitle}>
                {firstLine}
              </Text>
              <View style={styles.divider} />
              {restLines.map(renderLine)}
            </>
          ) : (
            lines.map(renderLine)
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
  onAgree,
  agreeLabel = "동의합니다",
}: LegalModalProps) {
  const [canAgree, setCanAgree] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);

  useEffect(() => {
    if (!open) {
      setCanAgree(false);
      setContentHeight(0);
      setLayoutHeight(0);
    }
  }, [open]);

  useEffect(() => {
    if (contentHeight > 0 && layoutHeight > 0 && contentHeight <= layoutHeight) {
      setCanAgree(true);
    }
  }, [contentHeight, layoutHeight]);

  const handleScroll = (event: {
    nativeEvent: {
      layoutMeasurement: { height: number };
      contentOffset: { y: number };
      contentSize: { height: number };
    };
  }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (contentSize.height <= layoutMeasurement.height) {
      setCanAgree(true);
      return;
    }

    const padding = 12;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - padding) {
      setCanAgree(true);
    }
  };

  const rendered = useMemo(() => renderDescription(description), [description]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={open}>
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
            onScroll={handleScroll}
            onContentSizeChange={(_, nextHeight) => setContentHeight(nextHeight)}
            onLayout={(event) => setLayoutHeight(event.nativeEvent.layout.height)}
            scrollEventThrottle={16}
          >
            {rendered}
          </ScrollView>

          {onAgree && canAgree ? (
            <Pressable
              style={[
                styles.agreeButton,
                canAgree ? styles.agreeButtonActive : styles.agreeButtonDisabled,
              ]}
              disabled={!canAgree}
              onPress={onAgree}
            >
              <Text allowFontScaling={false} style={styles.agreeButtonText}>
                {agreeLabel}
              </Text>
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
  agreeButton: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(63, 221, 144, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  agreeButtonActive: {
    backgroundColor: "rgba(63, 221, 144, 0.18)",
    borderColor: AppColors.primaryGreen,
  },
  agreeButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  agreeButtonText: {
    color: AppColors.white,
    fontSize: IS_SMALL ? 13 : 14,
    fontWeight: "700",
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
  question: {
    color: AppColors.primaryGreen,
    fontWeight: "800",
  },
  link: {
    color: AppColors.primaryGreen,
    textDecorationLine: "underline",
    fontWeight: "700",
  },
});

