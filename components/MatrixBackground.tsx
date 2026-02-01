import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { AppColors } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

const CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*<>[]{}=+-~^αβγδεζηθλμπσωΦΨΩ∞∑∏√∫≈≠≤≥";
const COLUMN_WIDTH = 14;
const NUM_COLUMNS = Math.floor(width / COLUMN_WIDTH);

type MatrixColumnProps = {
  index: number;
  delay: number;
};

const MatrixColumn = ({ index, delay }: MatrixColumnProps) => {
  const animValue = useRef(new Animated.Value(0)).current;

  const chars = useMemo(() => {
    const length = Math.floor(Math.random() * 15) + 8;
    return Array.from({ length }, () =>
      CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
    );
  }, []);

  useEffect(() => {
    const animate = () => {
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: Math.random() * 3000 + 2000,
        delay: delay,
        useNativeDriver: true,
      }).start(() => animate());
    };
    animate();
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, height + 100],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 0.8, 0.8, 0],
  });

  return (
    <Animated.View
      style={[
        styles.column,
        {
          left: index * COLUMN_WIDTH,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {chars.map((char, i) => (
        <Text
          key={i}
          style={[
            styles.char,
            i === chars.length - 1 && styles.headChar,
            i < 3 && styles.fadeChar,
          ]}
        >
          {char}
        </Text>
      ))}
    </Animated.View>
  );
};

export default function MatrixBackground() {
  const columns = useMemo(() => {
    return Array.from({ length: NUM_COLUMNS }, (_, i) => ({
      index: i,
      delay: Math.random() * 3000,
    }));
  }, []);

  return (
    <View style={styles.container}>
      {columns.map((col, i) => (
        <MatrixColumn key={i} index={col.index} delay={col.delay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  column: {
    position: "absolute",
    top: 0,
  },
  char: {
    fontSize: 12,
    fontFamily: "monospace",
    color: AppColors.primaryGreen,
    opacity: 0.4,
    lineHeight: 14,
    textAlign: "center",
    width: COLUMN_WIDTH,
  },
  headChar: {
    color: "#FFFFFF",
    opacity: 1,
    textShadowColor: AppColors.primaryGreen,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  fadeChar: {
    opacity: 0.2,
  },
});
