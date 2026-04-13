import { Image, StyleSheet, View } from "react-native";

type StampFrameProps = {
  uri: string;
  size?: number;
};

export default function StampFrame({ uri, size = 220 }: StampFrameProps) {
  return (
    <View style={[styles.outer, { width: size, height: size * 1.25 }]}>
      <View style={styles.inner}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: "#f3f0ec",
    borderRadius: 24,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  inner: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#ddd",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});