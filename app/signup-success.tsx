import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function SignupSuccessRedirect() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();

  useEffect(() => {
    const encodedEmail = typeof email === "string" ? email : "";
    router.replace({
      pathname: "/(auth)/signup",
      params: { email: encodedEmail, verified: "1" },
    });
  }, [email, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
