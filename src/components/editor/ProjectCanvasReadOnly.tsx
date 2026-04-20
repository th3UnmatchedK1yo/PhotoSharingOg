import { useMemo, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import {
  ASSET_MAP,
  BACKGROUND_MAP,
  FONT_OPTIONS,
} from "../../constants/editorCatalog";
import type {
  AssetLayer,
  ProjectCanvasConfig,
  StampLayer,
  TextLayer,
} from "../../types/project";
import type { Stamp } from "../../types/stamp";
import StampFrame from "../stamp/StampFrame";

type RenderLayer =
  | { kind: "asset"; layer: AssetLayer; z: number }
  | { kind: "stamp"; layer: StampLayer; z: number }
  | { kind: "text"; layer: TextLayer; z: number };

const STAMP_BASE_WIDTH = 122;
const STAMP_BASE_HEIGHT = Math.round(STAMP_BASE_WIDTH * 1.25);
const BASE_DECORATION_LONG_SIDE = 92;
const BACKGROUND_ASPECT_RATIO = 1587 / 2245;

function resolveEditorImageSource(key: string) {
  return ASSET_MAP[key] ?? BACKGROUND_MAP[key];
}

function isBackgroundAssetKey(key: string) {
  return Boolean(BACKGROUND_MAP[key]);
}

function getBackgroundBaseSize(canvasWidth: number, canvasHeight: number) {
  const maxWidth = canvasWidth * 0.86;
  const maxHeight = canvasHeight * 0.86;

  let width = maxWidth;
  let height = width / BACKGROUND_ASPECT_RATIO;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * BACKGROUND_ASPECT_RATIO;
  }

  return { width, height };
}

function getDecorationBaseSize(assetKey: string) {
  const source = resolveEditorImageSource(assetKey);
  if (!source) {
    return { width: 0, height: 0 };
  }

  const resolved = Image.resolveAssetSource(source);
  const intrinsicWidth = resolved?.width || 100;
  const intrinsicHeight = resolved?.height || 100;

  if (intrinsicWidth >= intrinsicHeight) {
    const width = BASE_DECORATION_LONG_SIDE;
    return {
      width,
      height: (width * intrinsicHeight) / intrinsicWidth,
    };
  }

  const height = BASE_DECORATION_LONG_SIDE;
  return {
    width: (height * intrinsicWidth) / intrinsicHeight,
    height,
  };
}

function getTextBaseSize(layer: TextLayer) {
  const safeText = layer.text?.trim() || "Text";
  const width = Math.max(88, safeText.length * layer.fontSize * 0.56);
  const height = Math.max(42, layer.fontSize * 1.55);
  return { width, height };
}

function StampLayerView({
  layer,
  stamp,
  canvasWidth,
  canvasHeight,
}: {
  layer: StampLayer;
  stamp: Stamp;
  canvasWidth: number;
  canvasHeight: number;
}) {
  return (
    <View
      style={[
        styles.absoluteLayer,
        {
          left: layer.x * canvasWidth,
          top: layer.y * canvasHeight,
          zIndex: layer.z,
          transform: [
            { rotateZ: `${layer.rotation}deg` },
            { scale: layer.scale },
          ],
        },
      ]}
    >
      <StampFrame uri={stamp.imageUrl} size={STAMP_BASE_WIDTH} />
    </View>
  );
}

function AssetLayerView({
  layer,
  canvasWidth,
  canvasHeight,
}: {
  layer: AssetLayer;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const source = resolveEditorImageSource(layer.assetKey);
  if (!source) return null;

  const { width, height } = isBackgroundAssetKey(layer.assetKey)
    ? getBackgroundBaseSize(canvasWidth, canvasHeight)
    : getDecorationBaseSize(layer.assetKey);

  return (
    <View
      style={[
        styles.absoluteLayer,
        {
          left: layer.x * canvasWidth,
          top: layer.y * canvasHeight,
          zIndex: layer.z,
          transform: [
            { rotateZ: `${layer.rotation}deg` },
            { scale: layer.scale },
          ],
        },
      ]}
    >
      <Image source={source} style={{ width, height }} resizeMode="contain" />
    </View>
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
  const { width, height } = getTextBaseSize(layer);

  return (
    <View
      style={[
        styles.absoluteLayer,
        {
          left: layer.x * canvasWidth,
          top: layer.y * canvasHeight,
          width,
          minHeight: height,
          zIndex: layer.z,
          transform: [
            { rotateZ: `${layer.rotation}deg` },
            { scale: layer.scale },
          ],
        },
      ]}
    >
      <Text
        style={{
          fontFamily,
          fontSize: layer.fontSize,
          color: layer.color,
        }}
      >
        {layer.text || "Text"}
      </Text>
    </View>
  );
}

export default function ProjectCanvasReadOnly({
  canvas,
  stamps,
}: {
  canvas: ProjectCanvasConfig;
  stamps: Stamp[];
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const stampMap = useMemo(() => {
    const map = new Map<string, Stamp>();
    for (const stamp of stamps) {
      map.set(stamp.id, stamp);
    }
    return map;
  }, [stamps]);

  const orderedLayers = useMemo<RenderLayer[]>(() => {
    const merged: RenderLayer[] = [
      ...canvas.assetLayers.map((layer) => ({
        kind: "asset" as const,
        layer,
        z: layer.z,
      })),
      ...canvas.stampLayers.map((layer) => ({
        kind: "stamp" as const,
        layer,
        z: layer.z,
      })),
      ...canvas.textLayers.map((layer) => ({
        kind: "text" as const,
        layer,
        z: layer.z,
      })),
    ];

    merged.sort((a, b) => a.z - b.z);
    return merged;
  }, [canvas]);

  const ready = size.width > 0 && size.height > 0;

  return (
    <View style={[styles.canvas, styles.board]} onLayout={onLayout}>
      {ready &&
        orderedLayers.map((entry) => {
          if (entry.kind === "stamp") {
            const stamp = stampMap.get(entry.layer.stampId);
            if (!stamp) return null;

            return (
              <StampLayerView
                key={entry.layer.id}
                layer={entry.layer}
                stamp={stamp}
                canvasWidth={size.width}
                canvasHeight={size.height}
              />
            );
          }

          if (entry.kind === "asset") {
            return (
              <AssetLayerView
                key={entry.layer.id}
                layer={entry.layer}
                canvasWidth={size.width}
                canvasHeight={size.height}
              />
            );
          }

          return (
            <TextLayerView
              key={entry.layer.id}
              layer={entry.layer}
              canvasWidth={size.width}
              canvasHeight={size.height}
            />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    minHeight: 440,
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
  },
  board: {
    backgroundColor: "#f8f7f3",
    borderWidth: 1,
    borderColor: "#e8e1da",
  },
  absoluteLayer: {
    position: "absolute",
  },
});