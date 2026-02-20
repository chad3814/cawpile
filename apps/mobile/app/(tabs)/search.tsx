import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>Search</Text>
        <Text style={{ fontSize: 16, color: "#64748b", marginTop: 8 }}>
          Search for books to add to your library
        </Text>
      </View>
    </SafeAreaView>
  );
}
