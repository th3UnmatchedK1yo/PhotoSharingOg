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
import { COLORS } from "../../constants/theme";
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
const TEXT_HORIZONTAL_PADDING = 8;
const TEXT_VERTICAL_PADDING = 4;

function resolveEditorImageSource(layer: AssetLayer) {
  if (layer.imageUri) {
    return { uri: layer.imageUri };
  }

  return ASSET_MAP[layer.assetKey] ?? BACKGROUND_MAP[layer.assetKey];
}

function isBackgroundAssetKey(key: string) {
  return Boolean(BACKGROUND_MAP[key]);
}

function getBackgroundBaseSize(canvasWidth: number, canvasHeight: number) {
  let width = canvasWidth;
  let height = width / BACKGROUND_ASPECT_RATIO;

  if (height < canvasHeight) {
    height = canvasHeight;
    width = height * BACKGROUND_ASPECT_RATIO;
  }

  return { width, height };
}

function getDecorationBaseSize(layer: AssetLayer) {
  const source = resolveEditorImageSource(layer);
  if (!source) return { width: 0, height: 0 };

  const resolved = Image.resolveAssetSource(source);
  const intrinsicWidth = layer.imageWidth || resolved?.width || 100;
  const intrinsicHeight = layer.imageHeight || resolved?.height || 100;

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
  const safeText = layer.text || "Text";
  const lines = safeText.split(/\r?\n/);
  const longestLine = lines.reduce(
    (longest, line) => (line.length > longest.length ? line : longest),
    "",
  );
  const isScriptFont =
    layer.fontKey === "fz-kingshare" ||
    layer.fontKey === "blosta-script" ||
    layer.fontKey === "pinyon-script";
  const widthFactor = isScriptFont ? 1.08 : 0.68;
  const lineHeight = layer.fontSize * (isScriptFont ? 1.75 : 1.28);
  const textWidth = Math.max(34, longestLine.length * layer.fontSize * widthFactor);
  const width = textWidth + TEXT_HORIZONTAL_PADDING * 2;
  const height = lines.length * lineHeight + TEXT_VERTICAL_PADDING * 2;
  return { width, height, lineHeight, textWidth };
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
  const source = resolveEditorImageSource(layer);
  if (!source) return null;

  const isBackground = isBackgroundAssetKey(layer.assetKey);
  const { width, height } = isBackground
    ? getBackgroundBaseSize(canvasWidth, canvasHeight)
    : getDecorationBaseSize(layer);

  if (isBackground) {
    return (
      <View
        style={[
          styles.absoluteLayer,
          {
            left: (canvasWidth - width) / 2,
            top: (canvasHeight - height) / 2,
            width,
            height,
            zIndex: layer.z,
          },
        ]}
      >
        <Image source={source} style={{ width, height }} resizeMode="cover" />
      </View>
    );
  }

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
  const textSize = getTextBaseSize(layer);
  const width = textSize.width;
  const height = textSize.height;
  const lines = (layer.text || "Text").split(/\r?\n/);

  return (
    <View
      style={[
        styles.absoluteLayer,
        {
          left: layer.x * canvasWidth,
          top: layer.y * canvasHeight,
          width,
          height,
          paddingHorizontal: TEXT_HORIZONTAL_PADDING,
          paddingVertical: TEXT_VERTICAL_PADDING,
          zIndex: layer.z,
          transform: [
            { rotateZ: `${layer.rotation}deg` },
            { scale: layer.scale },
          ],
        },
      ]}
    >
      {lines.map((line, index) => (
        <Text
          key={`${layer.id}-line-${index}`}
          numberOfLines={1}
          ellipsizeMode="clip"
          allowFontScaling={false}
          style={{
            fontFamily,
            fontSize: layer.fontSize,
            lineHeight: textSize.lineHeight,
            color: layer.color,
            includeFontPadding: false,
            width: textSize.textWidth,
            flexShrink: 0,
          }}
        >
          {line || " "}
        </Text>
      ))}
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
    flex: 1,
    minHeight: 440,
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
  },
  board: {
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  absoluteLayer: {
    position: "absolute",
  },
});
