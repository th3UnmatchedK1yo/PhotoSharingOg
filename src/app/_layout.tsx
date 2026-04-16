import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import "../../global.css";
import { AuthProvider } from "../providers/AuthProvider";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    FzKingshare: require("../assets/fonts/Kingshare.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f1ed" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
