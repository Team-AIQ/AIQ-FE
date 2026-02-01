import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#020304" },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password-email" />
      <Stack.Screen name="forgot-password-code" />
      <Stack.Screen name="forgot-password-reset" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
