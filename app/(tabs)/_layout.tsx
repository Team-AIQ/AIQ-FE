import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="report-loading" options={{ href: null }} />
      <Tabs.Screen name="report-select" options={{ href: null }} />
      <Tabs.Screen name="report-detail" options={{ href: null }} />
      <Tabs.Screen name="report-chat-options" options={{ href: null }} />
    </Tabs>
  );
}
