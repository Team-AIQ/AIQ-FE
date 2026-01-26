/**
 * Explore Tab (임시)
 * - Expo 기본 예제 제거
 * - 이미지 / Parallax / 외부 링크 전부 제거
 */

import { View, Text, StyleSheet } from "react-native";

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Explore (WIP)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
  },
});
