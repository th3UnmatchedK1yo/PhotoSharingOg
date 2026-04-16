import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../providers/AuthProvider";

export default function IndexScreen() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f5f1ed]">
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={session ? "/stamp" : "/sign-in"} />;
}