import { View, Text } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Link } from "expo-router";
export default function Home() {
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-2xl font-bold text-white">Home</Text>
      <Link href="/camera" className="text-white-500>">
        OPEN CAMERA
      </Link>
    </View>
  );
}
