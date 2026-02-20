import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LibraryScreen() {
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>Library</Text>
        <Text style={{ fontSize: 16, color: "#64748b", marginTop: 8 }}>
          Your book collection will appear here
        </Text>
      </View>
    </SafeAreaView>
  );
}
