import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="stamp/index" />
      <Stack.Screen name="stamp/review" />
      <Stack.Screen name="book/index" />
      <Stack.Screen name="book/[day]" />
    </Stack>
  );
}