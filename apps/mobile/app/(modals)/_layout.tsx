import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function ModalsLayout() {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#0f172a" : "#ffffff";
  const headerTintColor = colorScheme === "dark" ? "#f8fafc" : "#1a1a1a";

  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        headerStyle: { backgroundColor },
        headerTintColor,
        headerShadowVisible: false,
      }}
    />
  );
}
