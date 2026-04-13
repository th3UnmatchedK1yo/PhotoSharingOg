import { View, Text } from "react-native";
import { AntDesign } from "@expo/vector-icons";
export default function Home() {
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-2xl font-bold text-white">Home</Text>
      <AntDesign name="caret-right" size={24} color="white" />
    </View>
  );
}
