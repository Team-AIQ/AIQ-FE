import { getAccessToken } from "@/lib/auth-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { View } from "react-native";

export default function NotFoundScreen() {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    const redirect = async () => {
      if (hasRedirectedRef.current) {
        return;
      }
      hasRedirectedRef.current = true;

      const token = await getAccessToken();
      const onboardingRequired =
        (await AsyncStorage.getItem("onboarding_required")) === "true";
      if (token) {
        router.replace(onboardingRequired ? "/(auth)/onboarding" : "/(tabs)");
      } else {
        router.replace("/(auth)/welcome");
      }
    };
    void redirect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <View />;
}
