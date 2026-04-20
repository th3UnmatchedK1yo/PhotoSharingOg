import { Redirect, Stack, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { getMyProfile } from "../../services/profiles";

export default function ProtectedLayout() {
  const { loading, session } = useAuth();
  const segments = useSegments();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const checkProfile = async () => {
      if (!session?.user) {
        if (!active) return;
        setSetupCompleted(null);
        setCheckingProfile(false);
        return;
      }

      try {
        setCheckingProfile(true);
        const profile = await getMyProfile(session.user.id);

        if (!active) return;

        setSetupCompleted(Boolean(profile?.setupCompleted));
      } catch (error) {
        console.log("getMyProfile(protected layout) error:", error);
        if (!active) return;
        setSetupCompleted(false);
      } finally {
        if (active) {
          setCheckingProfile(false);
        }
      }
    };

    checkProfile();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  if (loading || checkingProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f5f1ed]">
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  const isSetupRoute =
    segments.includes("(protected)") &&
    segments.includes("profile") &&
    segments.includes("setup");

  if (setupCompleted === false && !isSetupRoute) {
    return <Redirect href="/profile/setup" />;
  }

  if (setupCompleted === true && isSetupRoute) {
    return <Redirect href="/stamp" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="stamp/index" />
      <Stack.Screen name="stamp/review" />
      <Stack.Screen name="book/index" />
      <Stack.Screen name="book/[day]" />
      <Stack.Screen name="calendar/index" />
      <Stack.Screen name="editor/index" />
      <Stack.Screen name="editor/[id]" options={{ gestureEnabled: false }} />
      <Stack.Screen name="editor/select-stamps" />
      <Stack.Screen name="friends/index" />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="profile/setup" />
    </Stack>
  );
}