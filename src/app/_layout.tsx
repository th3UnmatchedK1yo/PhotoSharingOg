import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../../global.css";
import { COLORS } from "../constants/theme";
import { AuthProvider } from "../providers/AuthProvider";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    FzKingshare: require("../assets/fonts/Kingshare.ttf"),
    BlostaScript: require("../assets/fonts/BlostaScript.otf"),
    PinyonScript: require("../assets/fonts/PinyonScript-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}