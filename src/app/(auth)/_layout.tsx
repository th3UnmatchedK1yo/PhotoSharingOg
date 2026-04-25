import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../providers/AuthProvider";

export default function AuthLayout() {
  const { loading, session } = useAuth();

  if (loading) {
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

  if (session) {
    return <Redirect href="/stamp" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}