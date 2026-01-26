/**
 * Tab Home (임시)
 * - Splash 이후 진입할 메인 화면 자리
 * - 현재는 내용 없음 (에러 방지용)
 */

import { StyleSheet, Text, View } from "react-native";

export default function TabHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home (WIP)</Text>
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
