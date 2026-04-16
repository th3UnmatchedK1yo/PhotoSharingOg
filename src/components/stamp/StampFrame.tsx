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

      <View pointerEvents="none" style={styles.trimOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  inner: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#ddd",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  trimOverlay: {
    position: "absolute",
    top: 2,
    right: 2,
    bottom: 2,
    left: 2,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(240, 225, 198, 0.9)",
  },
});