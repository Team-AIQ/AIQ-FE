import { useEffect, useMemo } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get("window");

type Star = {
  id: string;
  left: number;
  top: number;
  size: number;
  opacity: Animated.Value;
  duration: number;
  delay: number;
};

type StarfieldBackgroundProps = {
  density?: number;
  maxOpacity?: number;
};

export default function StarfieldBackground({
  density = 0.00018,
  maxOpacity = 0.9,
}: StarfieldBackgroundProps) {
  const stars = useMemo<Star[]>(() => {
    const count = Math.max(40, Math.floor(width * height * density));
    return Array.from({ length: count }, (_, index) => {
      const size = Math.random() * 2.4 + 0.6;
      return {
        id: `star-${index}`,
        left: Math.random() * width,
        top: Math.random() * height,
        size,
        opacity: new Animated.Value(Math.random() * 0.4 + 0.2),
        duration: Math.random() * 3200 + 1800,
        delay: Math.random() * 2400,
      };
    });
  }, [density]);

  useEffect(() => {
    const animations = stars.map((star) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: Math.min(maxOpacity, 0.95),
            duration: star.duration,
            delay: star.delay,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: Math.max(0.1, maxOpacity - 0.6),
            duration: star.duration + 400,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [maxOpacity, stars]);

  return (
    <View pointerEvents="none" style={styles.container}>
      {stars.map((star) => (
        <Animated.View
          key={star.id}
          style={[
            styles.star,
            {
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              left: star.left,
              top: star.top,
              opacity: star.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  star: {
    position: "absolute",
    backgroundColor: "#E8FFF5",
  },
});
