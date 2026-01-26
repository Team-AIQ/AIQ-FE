import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // ✅ 모든 화면 헤더 숨김
      }}
    />
  );
}
