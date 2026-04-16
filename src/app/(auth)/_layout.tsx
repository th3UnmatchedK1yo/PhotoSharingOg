import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../providers/AuthProvider";

export default function AuthLayout() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f5f1ed]">
        <ActivityIndicator />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/stamp" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}