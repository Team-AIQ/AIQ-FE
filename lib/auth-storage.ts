import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export async function saveAuthTokens(
  accessToken: string,
  refreshToken: string,
) {
  await Promise.all([
    AsyncStorage.setItem("accessToken", accessToken),
    AsyncStorage.setItem("refreshToken", refreshToken),
    SecureStore.setItemAsync("accessToken", accessToken),
    SecureStore.setItemAsync("refreshToken", refreshToken),
  ]);
}

export async function getAccessToken() {
  const asyncToken = await AsyncStorage.getItem("accessToken");
  if (asyncToken) return asyncToken;

  const secureToken = await SecureStore.getItemAsync("accessToken");
  if (secureToken) {
    await AsyncStorage.setItem("accessToken", secureToken);
  }

  return secureToken;
}
