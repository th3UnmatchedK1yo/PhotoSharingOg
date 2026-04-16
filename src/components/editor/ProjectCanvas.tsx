import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { ASSET_MAP, BACKGROUND_MAP, FONT_OPTIONS } from "../../constants/editorCatalog";
import type {
  AssetLayer,
  ProjectCanvasConfig,
  StampLayer,
  TextLayer,
} from "../../types/project";
import type { Stamp } from "../../types/stamp";
import StampFrame from "../stamp/StampFrame";

type ProjectCanvasProps = {
  backgroundKey: string;
  canvas: ProjectCanvasConfig;
  stamps: Stamp[];
  onStampDragEnd?: (layerId: string, x: number, y: number) => void;
  onAssetDragEnd?: (layerId: string, x: number, y: number) => void;
};

const STAMP_BASE = 120;
const ASSET_BASE = 80;

function DraggableLayer({
  x,
  y,
  z,
  rotation,
  canvasWidth,
  canvasHeight,
  layerWidth,
  layerHeight,
  onDragEnd,
  children,
}: {
  x: number;
  y: number;
  z: number;
  rotation: number;
  canvasWidth: number;
  canvasHeight: number;
  layerWidth: number;
  layerHeight: number;
  onDragEnd: (nx: number, ny: number) => void;
  children: React.ReactNode;
}) {
  const pan = useRef(new Animated.ValueXY()).current;

  const posRef = useRef({ x, y });
  posRef.current = { x, y };

  const dimsRef = useRef({ canvasWidth, canvasHeight, layerWidth, layerHeight });
  dimsRef.current = { canvasWidth, canvasHeight, layerWidth, layerHeight };

  const cbRef = useRef(onDragEnd);
  cbRef.current = onDragEnd;

  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, [x, y, pan]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) =>
          Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2,
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false },
        ),
        onPanResponderRelease: (_, gs) => {
          const d = dimsRef.current;
          const p = posRef.current;

          const rawX = p.x * d.canvasWidth + gs.dx;
          const rawY = p.y * d.canvasHeight + gs.dy;

          const clampedX = Math.max(0, Math.min(rawX, d.canvasWidth - d.layerWidth));
          const clampedY = Math.max(0, Math.min(rawY, d.canvasHeight - d.layerHeight));

          const nx = d.canvasWidth > 0 ? clampedX / d.canvasWidth : 0;
          const ny = d.canvasHeight > 0 ? clampedY / d.canvasHeight : 0;

          pan.setValue({ x: 0, y: 0 });
          cbRef.current(nx, ny);
        },
      }),
    [pan],
  );

  const pxX = x * canvasWidth;
  const pxY = y * canvasHeight;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: pxX,
        top: pxY,
        zIndex: z,
        transform: [
          { translateX: pan.x },
          { translateY: pan.y },
          { rotate: `${rotation}deg` },
        ],
      }}
      {...responder.panHandlers}
    >
      {children}
    </Animated.View>
  );
}

function StampLayerView({
  layer,
  stamp,
  canvasWidth,
  canvasHeight,
  onDragEnd,
}: {
  layer: StampLayer;
  stamp: Stamp;
  canvasWidth: number;
  canvasHeight: number;
  onDragEnd: (layerId: string, x: number, y: number) => void;
}) {
  const size = Math.round(STAMP_BASE * layer.scale);

  return (
    <DraggableLayer
      x={layer.x}
      y={layer.y}
      z={layer.z}
      rotation={layer.rotation}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      layerWidth={size}
      layerHeight={Math.round(size * 1.25)}
      onDragEnd={(nx, ny) => onDragEnd(layer.id, nx, ny)}
    >
      <StampFrame uri={stamp.imageUrl} size={size} />
    </DraggableLayer>
  );
}

function AssetLayerView({
  layer,
  canvasWidth,
  canvasHeight,
  onDragEnd,
}: {
  layer: AssetLayer;
  canvasWidth: number;
  canvasHeight: number;
  onDragEnd: (layerId: string, x: number, y: number) => void;
}) {
  const source = ASSET_MAP[layer.assetKey];
  if (!source) return null;

  const size = Math.round(ASSET_BASE * layer.scale);

  return (
    <DraggableLayer
      x={layer.x}
      y={layer.y}
      z={layer.z}
      rotation={layer.rotation}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      layerWidth={size}
      layerHeight={size}
      onDragEnd={(nx, ny) => onDragEnd(layer.id, nx, ny)}
    >
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </DraggableLayer>
  );
}

function TextLayerView({
  layer,
  canvasWidth,
  canvasHeight,
}: {
  layer: TextLayer;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const fontOption = FONT_OPTIONS.find((f) => f.key === layer.fontKey);
  const fontFamily = fontOption?.fontFamily ?? "serif";

  const pxX = layer.x * canvasWidth;
  const pxY = layer.y * canvasHeight;

  return (
    <View
      style={{
        position: "absolute",
        left: pxX,
        top: pxY,
        zIndex: layer.z,
        transform: [{ rotate: `${layer.rotation}deg` }],
      }}
    >
      <Text
        style={{
          fontFamily,
          fontSize: layer.fontSize,
          color: layer.color,
        }}
      >
        {layer.text}
      </Text>
    </View>
  );
}

export default function ProjectCanvas({
  backgroundKey,
  canvas,
  stamps,
  onStampDragEnd,
  onAssetDragEnd,
}: ProjectCanvasProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const stampMap = useMemo(() => {
    const map = new Map<string, Stamp>();
    for (const s of stamps) {
      map.set(s.id, s);
    }
    return map;
  }, [stamps]);

  const bgSource = BACKGROUND_MAP[backgroundKey];
  const ready = size.width > 0 && size.height > 0;

  const inner = (
    <>
      {ready &&
        canvas.stampLayers.map((layer) => {
          const stamp = stampMap.get(layer.stampId);
          if (!stamp) return null;
          return (
            <StampLayerView
              key={layer.id}
              layer={layer}
              stamp={stamp}
              canvasWidth={size.width}
              canvasHeight={size.height}
              onDragEnd={onStampDragEnd ?? (() => {})}
            />
          );
        })}

      {ready &&
        canvas.assetLayers.map((layer) => (
          <AssetLayerView
            key={layer.id}
            layer={layer}
            canvasWidth={size.width}
            canvasHeight={size.height}
            onDragEnd={onAssetDragEnd ?? (() => {})}
          />
        ))}

      {ready &&
        canvas.textLayers.map((layer) => (
          <TextLayerView
            key={layer.id}
            layer={layer}
            canvasWidth={size.width}
            canvasHeight={size.height}
          />
        ))}

      {stamps.length === 0 && canvas.assetLayers.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Empty canvas</Text>
          <Text style={styles.emptyText}>
            Add stamps from your collection to start designing.
          </Text>
        </View>
      )}
    </>
  );

  if (bgSource) {
    return (
      <ImageBackground
        source={bgSource}
        style={styles.canvas}
        resizeMode="cover"
        onLayout={onLayout}
      >
        {inner}
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.canvas, styles.fallbackBg]} onLayout={onLayout}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
    minHeight: 400,
  },
  fallbackBg: {
    backgroundColor: "#f8f5f1",
    borderWidth: 1,
    borderColor: "#e5ddd7",
  },
  emptyWrap: {
    flex: 1,
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
});
