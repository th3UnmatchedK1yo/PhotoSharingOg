import { StyleSheet, Text, View } from "react-native";
import StampFrame from "../stamp/StampFrame";
import type {
  ProjectBackground,
  ProjectCanvasConfig,
} from "../../types/project";
import type { Stamp } from "../../types/stamp";

type ProjectCanvasProps = {
  backgroundKey: ProjectBackground;
  canvas: ProjectCanvasConfig;
  stamps: Stamp[];
};

function GridOverlay() {
  return (
    <View pointerEvents="none" style={styles.gridOverlay}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={`v-${i}`}
          style={[styles.gridLineVertical, { left: `${(i + 1) * 14.28}%` }]}
        />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={`h-${i}`}
          style={[styles.gridLineHorizontal, { top: `${(i + 1) * 11.11}%` }]}
        />
      ))}
    </View>
  );
}

export default function ProjectCanvas({
  backgroundKey,
  canvas,
  stamps,
}: ProjectCanvasProps) {
  const visibleStamps =
    canvas.layout === "single"
      ? stamps.slice(0, 1)
      : canvas.layout === "two"
      ? stamps.slice(0, 2)
      : canvas.layout === "three"
      ? stamps.slice(0, 3)
      : stamps.slice(0, 4);

  return (
    <View style={[styles.canvas, backgroundStyles[backgroundKey]]}>
      {backgroundKey === "grid" ? <GridOverlay /> : null}

      {visibleStamps.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No stamps in this project yet</Text>
          <Text style={styles.emptyText}>
            Use the image button to add stamps from your collection.
          </Text>
        </View>
      ) : canvas.layout === "single" ? (
        <View style={styles.singleWrap}>
          <View style={styles.rot0}>
            <StampFrame uri={visibleStamps[0].imageUrl} size={180} />
          </View>
        </View>
      ) : canvas.layout === "two" ? (
        <View style={styles.twoWrap}>
          {visibleStamps[0] ? (
            <View style={styles.rotNeg}>
              <StampFrame uri={visibleStamps[0].imageUrl} size={150} />
            </View>
          ) : null}

          {visibleStamps[1] ? (
            <View style={styles.rotPos}>
              <StampFrame uri={visibleStamps[1].imageUrl} size={150} />
            </View>
          ) : null}
        </View>
      ) : canvas.layout === "three" ? (
        <View style={styles.threeWrap}>
          {visibleStamps[0] ? (
            <View style={[styles.absoluteStamp, styles.stampA]}>
              <View style={styles.rotNeg}>
                <StampFrame uri={visibleStamps[0].imageUrl} size={130} />
              </View>
            </View>
          ) : null}

          {visibleStamps[1] ? (
            <View style={[styles.absoluteStamp, styles.stampB]}>
              <View style={styles.rot0}>
                <StampFrame uri={visibleStamps[1].imageUrl} size={135} />
              </View>
            </View>
          ) : null}

          {visibleStamps[2] ? (
            <View style={[styles.absoluteStamp, styles.stampC]}>
              <View style={styles.rotPos}>
                <StampFrame uri={visibleStamps[2].imageUrl} size={130} />
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.gridWrap}>
          {visibleStamps.map((stamp) => (
            <View key={stamp.id} style={styles.gridItem}>
              <StampFrame uri={stamp.imageUrl} size={120} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const backgroundStyles = StyleSheet.create({
  paper: {
    backgroundColor: "#f8f5f1",
  },
  "soft-paper": {
    backgroundColor: "#f1ebe3",
  },
  plain: {
    backgroundColor: "#ffffff",
  },
  grid: {
    backgroundColor: "#f9f6f2",
  },
});

const styles = StyleSheet.create({
  canvas: {
    minHeight: 560,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#e5ddd7",
    overflow: "hidden",
    padding: 20,
    position: "relative",
  },
  emptyWrap: {
    flex: 1,
    minHeight: 520,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4f4a47",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#7b746f",
    textAlign: "center",
  },
  singleWrap: {
    minHeight: 520,
    alignItems: "center",
    justifyContent: "center",
  },
  twoWrap: {
    minHeight: 520,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 20,
    paddingTop: 70,
  },
  threeWrap: {
    minHeight: 520,
    position: "relative",
  },
  gridWrap: {
    minHeight: 520,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 18,
    paddingTop: 36,
  },
  gridItem: {
    width: 130,
    alignItems: "center",
  },
  absoluteStamp: {
    position: "absolute",
  },
  stampA: {
    left: 8,
    top: 80,
  },
  stampB: {
    left: 108,
    top: 48,
  },
  stampC: {
    right: 8,
    top: 120,
  },
  rotNeg: {
    transform: [{ rotate: "-8deg" }],
  },
  rot0: {
    transform: [{ rotate: "0deg" }],
  },
  rotPos: {
    transform: [{ rotate: "8deg" }],
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(160,150,140,0.10)",
  },
  gridLineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(160,150,140,0.10)",
  },
});