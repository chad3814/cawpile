import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Text } from "react-native";

const TAB_COLORS = {
  light: {
    active: "#3b82f6",
    inactive: "#64748b",
    background: "#ffffff",
    border: "#e2e8f0",
  },
  dark: {
    active: "#60a5fa",
    inactive: "#94a3b8",
    background: "#0f172a",
    border: "#334155",
  },
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? TAB_COLORS.dark : TAB_COLORS.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colorScheme === "dark" ? "#f8fafc" : "#1a1a1a",
      }}
    >
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>{"[]"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>{"()"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>{"@"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>{"*"}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
