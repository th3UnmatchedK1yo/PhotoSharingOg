import { useEffect, useMemo, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import {
  ASSET_MAP,
  BACKGROUND_MAP,
  FONT_OPTIONS,
} from "../../constants/editorCatalog";
import { COLORS } from "../../constants/theme";
import { STAMP_OUTER_ASPECT } from "../../constants/stampTemplate";
import type {
  AssetLayer,
  ProjectCanvasConfig,
  StampLayer,
  TextLayer,
} from "../../types/project";
import type { Stamp } from "../../types/stamp";
import StampFrame from "../stamp/StampFrame";

type LayerTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

type ProjectCanvasProps = {
  canvas: ProjectCanvasConfig;
  stamps: Stamp[];
  onStampTransformEnd?: (layerId: string, next: LayerTransform) => void;
  onAssetTransformEnd?: (layerId: string, next: LayerTransform) => void;
  onTextTransformEnd?: (layerId: string, next: LayerTransform) => void;
  onStampDoubleTap?: (layerId: string) => void;
  onAssetDoubleTap?: (layerId: string) => void;
  onTextDoubleTap?: (layerId: string) => void;
  onTextPress?: (layerId: string) => void;
  onCanvasPress?: () => void;
  selectedTextLayerId?: string | null;
};

type RenderLayer =
  | { kind: "asset"; layer: AssetLayer; z: number }
  | { kind: "stamp"; layer: StampLayer; z: number }
  | { kind: "text"; layer: TextLayer; z: number };

const STAMP_BASE_WIDTH = 122;
const STAMP_BASE_HEIGHT = Math.round(STAMP_BASE_WIDTH * STAMP_OUTER_ASPECT);
const BASE_DECORATION_LONG_SIDE = 92;
const BACKGROUND_ASPECT_RATIO = 1587 / 2245;
const MIN_SCALE = 0.35;
const MAX_SCALE = 4;
const RAD_TO_DEG = 180 / Math.PI;
const SNAP_THRESHOLD = 8;
const SNAP_GRID_COLUMNS = 4;
const SNAP_GRID_ROWS = 6;
const TEXT_HORIZONTAL_PADDING = 8;
const TEXT_VERTICAL_PADDING = 4;

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

function normalizeRotation(rotation: number) {
  "worklet";

  let next = rotation % 360;
  if (next > 180) next -= 360;
  if (next < -180) next += 360;
  return next;
}

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

function snapLayerToGrid(params: {
  rawLeftPx: number;
  rawTopPx: number;
  layerWidth: number;
  layerHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}) {
  "worklet";

  let nextLeftPx = params.rawLeftPx;
  let nextTopPx = params.rawTopPx;
  const centerX = params.rawLeftPx + params.layerWidth / 2;
  const centerY = params.rawTopPx + params.layerHeight / 2;

  for (let index = 1; index < SNAP_GRID_COLUMNS; index += 1) {
    const gridX = (params.canvasWidth / SNAP_GRID_COLUMNS) * index;
    if (Math.abs(centerX - gridX) <= SNAP_THRESHOLD) {
      nextLeftPx = gridX - params.layerWidth / 2;
      break;
    }
  }

  for (let index = 1; index < SNAP_GRID_ROWS; index += 1) {
    const gridY = (params.canvasHeight / SNAP_GRID_ROWS) * index;
    if (Math.abs(centerY - gridY) <= SNAP_THRESHOLD) {
      nextTopPx = gridY - params.layerHeight / 2;
      break;
    }
  }

  return {
    leftPx: nextLeftPx,
    topPx: nextTopPx,
  };
}

function clampLayerLeft(
  leftPx: number,
  canvasWidth: number,
  layerWidth: number,
) {
  "worklet";

  const minLeft = -layerWidth * 0.75;
  const maxLeft = canvasWidth - layerWidth * 0.25;

  return clamp(leftPx, minLeft, maxLeft);
}

function clampLayerTop(
  topPx: number,
  canvasHeight: number,
  layerHeight: number,
) {
  "worklet";

  const minTop = -layerHeight * 0.75;
  const maxTop = canvasHeight - layerHeight * 0.25;

  return clamp(topPx, minTop, maxTop);
}

function TransformableLayer({
  x,
  y,
  scale,
  rotation,
  z,
  canvasWidth,
  canvasHeight,
  baseWidth,
  baseHeight,
  onTransformEnd,
  onTap,
  onDoubleTap,
  children,
}: {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z: number;
  canvasWidth: number;
  canvasHeight: number;
  baseWidth: number;
  baseHeight: number;
  onTransformEnd: (next: LayerTransform) => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  children: React.ReactNode;
}) {
  const xSv = useSharedValue(x);
  const ySv = useSharedValue(y);
  const scaleSv = useSharedValue(scale);
  const rotationSv = useSharedValue(rotation);

  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const pinchScale = useSharedValue(1);
  const rotateDeg = useSharedValue(0);

  useEffect(() => {
    xSv.value = x;
    ySv.value = y;
    scaleSv.value = scale;
    rotationSv.value = rotation;
  }, [rotation, rotationSv, scale, scaleSv, x, xSv, y, ySv]);

  const commitTransform = () => {
    "worklet";

    const nextScale = clamp(
      scaleSv.value * pinchScale.value,
      MIN_SCALE,
      MAX_SCALE,
    );
    const nextRotation = normalizeRotation(rotationSv.value + rotateDeg.value);

    let rawLeftPx = xSv.value * canvasWidth + dragX.value;
    let rawTopPx = ySv.value * canvasHeight + dragY.value;

    const finalWidth = baseWidth * nextScale;
    const finalHeight = baseHeight * nextScale;
    const snapped = snapLayerToGrid({
      rawLeftPx,
      rawTopPx,
      layerWidth: finalWidth,
      layerHeight: finalHeight,
      canvasWidth,
      canvasHeight,
    });
    rawLeftPx = snapped.leftPx;
    rawTopPx = snapped.topPx;

    const clampedLeftPx = clampLayerLeft(rawLeftPx, canvasWidth, finalWidth);
    const clampedTopPx = clampLayerTop(rawTopPx, canvasHeight, finalHeight);

    const nextX = canvasWidth > 0 ? clampedLeftPx / canvasWidth : 0;
    const nextY = canvasHeight > 0 ? clampedTopPx / canvasHeight : 0;

    xSv.value = nextX;
    ySv.value = nextY;
    scaleSv.value = nextScale;
    rotationSv.value = nextRotation;

    dragX.value = 0;
    dragY.value = 0;
    pinchScale.value = 1;
    rotateDeg.value = 0;

    runOnJS(onTransformEnd)({
      x: nextX,
      y: nextY,
      scale: nextScale,
      rotation: nextRotation,
    });
  };

  const panGesture = Gesture.Pan()
    .minDistance(1)
    .onUpdate((event) => {
      dragX.value = event.translationX;
      dragY.value = event.translationY;

      const nextScale = clamp(
        scaleSv.value * pinchScale.value,
        MIN_SCALE,
        MAX_SCALE,
      );
      const rawLeftPx = xSv.value * canvasWidth + event.translationX;
      const rawTopPx = ySv.value * canvasHeight + event.translationY;
      const snapped = snapLayerToGrid({
        rawLeftPx,
        rawTopPx,
        layerWidth: baseWidth * nextScale,
        layerHeight: baseHeight * nextScale,
        canvasWidth,
        canvasHeight,
      });

      dragX.value = snapped.leftPx - xSv.value * canvasWidth;
      dragY.value = snapped.topPx - ySv.value * canvasHeight;
    })
    .onFinalize(() => {
      commitTransform();
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      pinchScale.value = event.scale;
    })
    .onFinalize(() => {
      commitTransform();
    });

  const rotationGesture = Gesture.Rotation()
    .onUpdate((event) => {
      rotateDeg.value = event.rotation * RAD_TO_DEG;
    })
    .onFinalize(() => {
      commitTransform();
    });

  const tapGesture = Gesture.Tap()
    .maxDistance(8)
    .onEnd((_event, success) => {
      if (success && onTap) {
        runOnJS(onTap)();
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(240)
    .maxDistance(10)
    .onEnd((_event, success) => {
      if (success && onDoubleTap) {
        runOnJS(onDoubleTap)();
      }
    });

  const gesture = Gesture.Exclusive(
    doubleTapGesture,
    tapGesture,
    Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: xSv.value * canvasWidth,
    top: ySv.value * canvasHeight,
    zIndex: z,
    width: baseWidth,
    height: baseHeight,
    transform: [
      { translateX: dragX.value },
      { translateY: dragY.value },
      { rotateZ: `${rotationSv.value + rotateDeg.value}deg` },
      { scale: scaleSv.value * pinchScale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}

function StampLayerView({
  layer,
  stamp,
  canvasWidth,
  canvasHeight,
  onTransformEnd,
  onDoubleTap,
}: {
  layer: StampLayer;
  stamp: Stamp;
  canvasWidth: number;
  canvasHeight: number;
  onTransformEnd: (layerId: string, next: LayerTransform) => void;
  onDoubleTap?: (layerId: string) => void;
}) {
  return (
    <TransformableLayer
      x={layer.x}
      y={layer.y}
      scale={layer.scale}
      rotation={layer.rotation}
      z={layer.z}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      baseWidth={STAMP_BASE_WIDTH}
      baseHeight={STAMP_BASE_HEIGHT}
      onTransformEnd={(next) => onTransformEnd(layer.id, next)}
      onDoubleTap={() => onDoubleTap?.(layer.id)}
    >
      <StampFrame uri={stamp.imageUrl} size={STAMP_BASE_WIDTH} shadow={false} />
    </TransformableLayer>
  );
}

function AssetLayerView({
  layer,
  canvasWidth,
  canvasHeight,
  onTransformEnd,
  onDoubleTap,
}: {
  layer: AssetLayer;
  canvasWidth: number;
  canvasHeight: number;
  onTransformEnd: (layerId: string, next: LayerTransform) => void;
  onDoubleTap?: (layerId: string) => void;
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
        pointerEvents="none"
        style={[
          styles.lockedBackground,
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
    <TransformableLayer
      x={layer.x}
      y={layer.y}
      scale={layer.scale}
      rotation={layer.rotation}
      z={layer.z}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      baseWidth={width}
      baseHeight={height}
      onTransformEnd={(next) => onTransformEnd(layer.id, next)}
      onDoubleTap={() => onDoubleTap?.(layer.id)}
    >
      <Image source={source} style={{ width, height }} resizeMode="contain" />
    </TransformableLayer>
  );
}

function TextLayerView({
  layer,
  canvasWidth,
  canvasHeight,
  selected,
  onTransformEnd,
  onPress,
  onDoubleTap,
}: {
  layer: TextLayer;
  canvasWidth: number;
  canvasHeight: number;
  selected: boolean;
  onTransformEnd: (layerId: string, next: LayerTransform) => void;
  onPress?: (layerId: string) => void;
  onDoubleTap?: (layerId: string) => void;
}) {
  const fontOption = FONT_OPTIONS.find((f) => f.key === layer.fontKey);
  const fontFamily = fontOption?.fontFamily ?? "serif";
  const textSize = getTextBaseSize(layer);
  const width = textSize.width;
  const height = textSize.height;
  const lines = (layer.text || "Text").split(/\r?\n/);

  return (
    <TransformableLayer
      x={layer.x}
      y={layer.y}
      scale={layer.scale}
      rotation={layer.rotation}
      z={layer.z}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      baseWidth={width}
      baseHeight={height}
      onTransformEnd={(next) => onTransformEnd(layer.id, next)}
      onTap={() => onPress?.(layer.id)}
      onDoubleTap={() => onDoubleTap?.(layer.id)}
    >
      <View
        style={[
          styles.textChip,
          { width, height },
          selected && styles.textChipSelected,
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
    </TransformableLayer>
  );
}

export default function ProjectCanvas({
  canvas,
  stamps,
  onStampTransformEnd,
  onAssetTransformEnd,
  onTextTransformEnd,
  onStampDoubleTap,
  onAssetDoubleTap,
  onTextDoubleTap,
  onTextPress,
  onCanvasPress,
  selectedTextLayerId,
}: ProjectCanvasProps) {
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

  const hasBackgroundLayer = canvas.assetLayers.some((layer) =>
    isBackgroundAssetKey(layer.assetKey),
  );
  const decorationAssetCount = canvas.assetLayers.filter(
    (layer) => !isBackgroundAssetKey(layer.assetKey),
  ).length;

  const isEmpty =
    !hasBackgroundLayer &&
    decorationAssetCount === 0 &&
    canvas.stampLayers.length === 0 &&
    canvas.textLayers.length === 0;

  const ready = size.width > 0 && size.height > 0;

  return (
    <View
      style={[styles.canvas, styles.board]}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onResponderRelease={onCanvasPress}
    >
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
                onTransformEnd={onStampTransformEnd ?? (() => {})}
                onDoubleTap={onStampDoubleTap}
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
                onTransformEnd={onAssetTransformEnd ?? (() => {})}
                onDoubleTap={onAssetDoubleTap}
              />
            );
          }

          return (
            <TextLayerView
              key={entry.layer.id}
              layer={entry.layer}
              canvasWidth={size.width}
              canvasHeight={size.height}
              selected={selectedTextLayerId === entry.layer.id}
              onTransformEnd={onTextTransformEnd ?? (() => {})}
              onPress={onTextPress}
              onDoubleTap={onTextDoubleTap}
            />
          );
        })}

      {isEmpty && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Empty canvas</Text>
          <Text style={styles.emptyText}>
            Add stamps from your collection to start designing.
          </Text>
        </View>
      )}
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
  board: {
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lockedBackground: {
    position: "absolute",
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
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  textChip: {
    alignSelf: "flex-start",
    paddingHorizontal: TEXT_HORIZONTAL_PADDING,
    paddingVertical: TEXT_VERTICAL_PADDING,
    borderRadius: 10,
    backgroundColor: COLORS.canvasTextChip,
  },
  textChipSelected: {
    borderWidth: 1,
    borderColor: COLORS.canvasTextChipBorder,
    backgroundColor: COLORS.canvasTextChipSelected,
  },
});
