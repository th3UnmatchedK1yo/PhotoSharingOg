import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../providers/AuthProvider";

export default function ProtectedLayout() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f5f1ed]">
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="stamp/index" />
      <Stack.Screen name="stamp/review" />
      <Stack.Screen name="book/index" />
      <Stack.Screen name="book/[day]" />
      <Stack.Screen name="calendar/index" />
      <Stack.Screen name="editor/index" />
      <Stack.Screen name="editor/[id]" />
      <Stack.Screen name="editor/select-stamps" />
    </Stack>
  );
}