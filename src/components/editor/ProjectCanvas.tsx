import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
  } from "react";
  import {
    Animated,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    View,
    type GestureResponderEvent,
    type LayoutChangeEvent,
    type PanResponderGestureState,
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
  
  type ProjectCanvasProps = {
    canvas: ProjectCanvasConfig;
    stamps: Stamp[];
    onStampDragEnd?: (layerId: string, x: number, y: number) => void;
    onAssetDragEnd?: (layerId: string, x: number, y: number) => void;
    onTextDragEnd?: (layerId: string, x: number, y: number) => void;
    onTextPress?: (layerId: string) => void;
    selectedTextLayerId?: string | null;
  };
  
  type RenderLayer =
    | { kind: "asset"; layer: AssetLayer; z: number }
    | { kind: "stamp"; layer: StampLayer; z: number }
    | { kind: "text"; layer: TextLayer; z: number };
  
  const STAMP_BASE = 122;
  const BASE_DECORATION_LONG_SIDE = 92;
  const BACKGROUND_ASPECT_RATIO = 1587 / 2245;
  
  function resolveEditorImageSource(key: string) {
    return ASSET_MAP[key] ?? BACKGROUND_MAP[key];
  }
  
  function isBackgroundAssetKey(key: string) {
    return Boolean(BACKGROUND_MAP[key]);
  }
  
  function getBackgroundFitSize(canvasWidth: number, canvasHeight: number) {
    const maxWidth = canvasWidth * 0.86;
    const maxHeight = canvasHeight * 0.86;
  
    let width = maxWidth;
    let height = width / BACKGROUND_ASPECT_RATIO;
  
    if (height > maxHeight) {
      height = maxHeight;
      width = height * BACKGROUND_ASPECT_RATIO;
    }
  
    return {
      width,
      height,
    };
  }
  
  function getDecorationSize(assetKey: string, scale: number) {
    const source = resolveEditorImageSource(assetKey);
    if (!source) {
      return { width: 0, height: 0 };
    }
  
    const resolved = Image.resolveAssetSource(source);
    const intrinsicWidth = resolved?.width || 100;
    const intrinsicHeight = resolved?.height || 100;
  
    if (intrinsicWidth >= intrinsicHeight) {
      const width = BASE_DECORATION_LONG_SIDE * scale;
      return {
        width,
        height: (width * intrinsicHeight) / intrinsicWidth,
      };
    }
  
    const height = BASE_DECORATION_LONG_SIDE * scale;
    return {
      width: (height * intrinsicWidth) / intrinsicHeight,
      height,
    };
  }
  
  function getTextBoxSize(layer: TextLayer) {
    const safeText = layer.text?.trim() || "Text";
    const width = Math.max(88, safeText.length * layer.fontSize * 0.56);
    const height = Math.max(42, layer.fontSize * 1.55);
  
    return { width, height };
  }
  
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
    onTap,
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
    onTap?: () => void;
    children: ReactNode;
  }) {
    const pan = useRef(new Animated.ValueXY()).current;
    const [renderPos, setRenderPos] = useState({ x, y });
  
    const draggingRef = useRef(false);
    const posRef = useRef({ x, y });
    const dimsRef = useRef({ canvasWidth, canvasHeight, layerWidth, layerHeight });
    const cbRef = useRef(onDragEnd);
    const tapRef = useRef(onTap);
  
    posRef.current = { x, y };
    dimsRef.current = { canvasWidth, canvasHeight, layerWidth, layerHeight };
    cbRef.current = onDragEnd;
    tapRef.current = onTap;
  
    useEffect(() => {
      if (!draggingRef.current) {
        setRenderPos({ x, y });
        pan.setValue({ x: 0, y: 0 });
      }
    }, [x, y, pan]);
  
    const finishGesture = (
      _evt: GestureResponderEvent,
      gestureState: PanResponderGestureState,
    ) => {
      const moved =
        Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
  
      if (!moved) {
        draggingRef.current = false;
        pan.setValue({ x: 0, y: 0 });
        tapRef.current?.();
        return;
      }
  
      const dims = dimsRef.current;
      const pos = posRef.current;
  
      const rawX = pos.x * dims.canvasWidth + gestureState.dx;
      const rawY = pos.y * dims.canvasHeight + gestureState.dy;
  
      const maxLeft = Math.max(0, dims.canvasWidth - dims.layerWidth);
      const maxTop = Math.max(0, dims.canvasHeight - dims.layerHeight);
  
      const clampedX = Math.max(0, Math.min(rawX, maxLeft));
      const clampedY = Math.max(0, Math.min(rawY, maxTop));
  
      const nx = dims.canvasWidth > 0 ? clampedX / dims.canvasWidth : 0;
      const ny = dims.canvasHeight > 0 ? clampedY / dims.canvasHeight : 0;
  
      setRenderPos({ x: nx, y: ny });
      draggingRef.current = false;
      pan.setValue({ x: 0, y: 0 });
      cbRef.current(nx, ny);
    };
  
    const responder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: (_, gs) =>
            Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2,
          onPanResponderGrant: () => {
            draggingRef.current = true;
          },
          onPanResponderMove: Animated.event(
            [null, { dx: pan.x, dy: pan.y }],
            { useNativeDriver: false },
          ),
          onPanResponderRelease: finishGesture,
          onPanResponderTerminate: finishGesture,
        }),
      [pan],
    );
  
    const pxX = renderPos.x * canvasWidth;
    const pxY = renderPos.y * canvasHeight;
  
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
    const width = Math.round(STAMP_BASE * layer.scale);
    const height = Math.round(width * 1.25);
  
    return (
      <DraggableLayer
        x={layer.x}
        y={layer.y}
        z={layer.z}
        rotation={layer.rotation}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        layerWidth={width}
        layerHeight={height}
        onDragEnd={(nx, ny) => onDragEnd(layer.id, nx, ny)}
      >
        <StampFrame uri={stamp.imageUrl} size={width} />
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
    const source = resolveEditorImageSource(layer.assetKey);
    if (!source) return null;
  
    const { width, height } = isBackgroundAssetKey(layer.assetKey)
      ? (() => {
          const fit = getBackgroundFitSize(canvasWidth, canvasHeight);
          return {
            width: fit.width * layer.scale,
            height: fit.height * layer.scale,
          };
        })()
      : getDecorationSize(layer.assetKey, layer.scale);
  
    return (
      <DraggableLayer
        x={layer.x}
        y={layer.y}
        z={layer.z}
        rotation={layer.rotation}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        layerWidth={width}
        layerHeight={height}
        onDragEnd={(nx, ny) => onDragEnd(layer.id, nx, ny)}
      >
        <Image
          source={source}
          style={{ width, height }}
          resizeMode="contain"
        />
      </DraggableLayer>
    );
  }
  
  function TextLayerView({
    layer,
    canvasWidth,
    canvasHeight,
    selected,
    onDragEnd,
    onPress,
  }: {
    layer: TextLayer;
    canvasWidth: number;
    canvasHeight: number;
    selected: boolean;
    onDragEnd: (layerId: string, x: number, y: number) => void;
    onPress?: (layerId: string) => void;
  }) {
    const fontOption = FONT_OPTIONS.find((f) => f.key === layer.fontKey);
    const fontFamily = fontOption?.fontFamily ?? "serif";
    const { width, height } = getTextBoxSize(layer);
  
    return (
      <DraggableLayer
        x={layer.x}
        y={layer.y}
        z={layer.z}
        rotation={layer.rotation}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        layerWidth={width}
        layerHeight={height}
        onDragEnd={(nx, ny) => onDragEnd(layer.id, nx, ny)}
        onTap={() => onPress?.(layer.id)}
      >
        <View style={[styles.textChip, selected && styles.textChipSelected]}>
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
      </DraggableLayer>
    );
  }
  
  export default function ProjectCanvas({
    canvas,
    stamps,
    onStampDragEnd,
    onAssetDragEnd,
    onTextDragEnd,
    onTextPress,
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
                  onDragEnd={onStampDragEnd ?? (() => {})}
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
                  onDragEnd={onAssetDragEnd ?? (() => {})}
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
                onDragEnd={onTextDragEnd ?? (() => {})}
                onPress={onTextPress}
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
  
        {ready && (
          <View style={styles.metricsBadge}>
            <Text style={styles.metricsText}>
              {Math.round(size.width)} × {Math.round(size.height)}
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
      backgroundColor: "#f8f7f3",
      borderWidth: 1,
      borderColor: "#e8e1da",
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
    textChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: "rgba(255,255,255,0.01)",
    },
    textChipSelected: {
      borderWidth: 1,
      borderColor: "rgba(95,90,86,0.35)",
      backgroundColor: "rgba(255,255,255,0.32)",
    },
    metricsBadge: {
      position: "absolute",
      right: 12,
      bottom: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.88)",
      borderWidth: 1,
      borderColor: "#e5ddd7",
    },
    metricsText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#6f6862",
    },
  });