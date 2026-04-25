import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { COLORS } from "../constants/theme";
import { useAuth } from "../providers/AuthProvider";

export default function IndexScreen() {
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

  return <Redirect href={session ? "/stamp" : "/sign-in"} />;
}