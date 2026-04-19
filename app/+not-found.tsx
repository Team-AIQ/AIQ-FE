import { getAccessToken } from "@/lib/auth-storage";
import { getUserProfile, hasPendingOnboarding } from "@/lib/user-session";
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
      if (token) {
        const profile = await getUserProfile();
        const onboardingPending = await hasPendingOnboarding(profile?.email);
        router.replace(onboardingPending ? "/(auth)/onboarding" : "/(tabs)");
      } else {
        router.replace("/(auth)/welcome");
      }
    };
    void redirect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <View />;
}
