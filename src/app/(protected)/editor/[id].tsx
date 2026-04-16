import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import EditorOptionsSheet from "../../../components/editor/EditorOptionsSheet";
import ProjectCanvas from "../../../components/editor/ProjectCanvas";
import { getProject, updateProjectDesign } from "../../../services/projects";
import type {
  AssetLayer,
  FontKey,
  Project,
  ProjectCanvasConfig,
  StampLayer,
  TextLayer,
} from "../../../types/project";
import type { Stamp } from "../../../types/stamp";

const BACKGROUND_LAYER_ID = "__paper_background_layer__";

function reconcileStampLayers(
  stamps: Stamp[],
  existing: StampLayer[],
): StampLayer[] {
  const layerByStamp = new Map(existing.map((layer) => [layer.stampId, layer]));
  const stampIds = new Set(stamps.map((stamp) => stamp.id));

  const kept = existing.filter((layer) => stampIds.has(layer.stampId));

  const added: StampLayer[] = [];
  stamps.forEach((stamp, idx) => {
    if (!layerByStamp.has(stamp.id)) {
      const col = idx % 2;
      const row = Math.floor(idx / 2);

      added.push({
        id: `sl-${stamp.id}`,
        stampId: stamp.id,
        x: 0.08 + col * 0.42,
        y: 0.08 + row * 0.28,
        scale: 1,
        rotation: 0,
        z: kept.length + added.length + 1,
      });
    }
  });

  return [...kept, ...added];
}

function areStampLayersEqual(a: StampLayer[], b: StampLayer[]) {
  if (a.length !== b.length) return false;

  return a.every((layer, index) => {
    const other = b[index];
    return (
      !!other &&
      layer.id === other.id &&
      layer.stampId === other.stampId &&
      layer.x === other.x &&
      layer.y === other.y &&
      layer.scale === other.scale &&
      layer.rotation === other.rotation &&
      layer.z === other.z
    );
  });
}

function getBackgroundLayer(canvas: ProjectCanvasConfig) {
  return canvas.assetLayers.find((layer) => layer.id === BACKGROUND_LAYER_ID);
}

function getSelectedBackgroundKey(project: Project | null) {
  if (!project) return "";
  return getBackgroundLayer(project.canvas)?.assetKey ?? "";
}

function buildBackgroundLayer(
  assetKey: string,
  existing?: AssetLayer,
): AssetLayer {
  return {
    id: BACKGROUND_LAYER_ID,
    assetKey,
    x: existing?.x ?? 0.07,
    y: existing?.y ?? 0.12,
    scale: existing?.scale ?? 1,
    rotation: existing?.rotation ?? 0,
    z: 0,
  };
}

function getMaxZ(canvas: ProjectCanvasConfig) {
  return Math.max(
    0,
    ...canvas.stampLayers.map((layer) => layer.z),
    ...canvas.assetLayers.map((layer) => layer.z),
    ...canvas.textLayers.map((layer) => layer.z),
  );
}

type SheetTab = "backgrounds" | "assets" | "text";

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SheetTab>("backgrounds");
  const [selectedTextLayerId, setSelectedTextLayerId] = useState<string | null>(
    null,
  );

  const didReconcile = useRef(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProject = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      didReconcile.current = false;
      const data = await getProject(id);
      setProject(data);
    } catch (error) {
      console.log("getProject error:", error);
      Alert.alert("Error", "Failed to load project.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadProject();
    }, [loadProject]),
  );

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!project || didReconcile.current) return;
    didReconcile.current = true;

    let nextCanvas = project.canvas;
    let changed = false;

    const reconciledStamps = reconcileStampLayers(
      project.stamps,
      nextCanvas.stampLayers,
    );

    if (!areStampLayersEqual(reconciledStamps, nextCanvas.stampLayers)) {
      nextCanvas = {
        ...nextCanvas,
        stampLayers: reconciledStamps,
      };
      changed = true;
    }

    if (
      !getBackgroundLayer(nextCanvas) &&
      project.backgroundKey &&
      project.backgroundKey !== "bg1"
    ) {
      nextCanvas = {
        ...nextCanvas,
        assetLayers: [
          buildBackgroundLayer(project.backgroundKey),
          ...nextCanvas.assetLayers,
        ],
      };
      changed = true;
    }

    if (!changed) return;

    setProject((prev) => (prev ? { ...prev, canvas: nextCanvas } : prev));

    updateProjectDesign(project.id, { canvas: nextCanvas }).catch((error) => {
      console.log("reconcile save error:", error);
    });
  }, [project]);

  useEffect(() => {
    if (!project) return;

    if (
      selectedTextLayerId &&
      project.canvas.textLayers.some((layer) => layer.id === selectedTextLayerId)
    ) {
      return;
    }

    setSelectedTextLayerId(project.canvas.textLayers[0]?.id ?? null);
  }, [project, selectedTextLayerId]);

  const queueCanvasPersist = useCallback(
    (canvas: ProjectCanvasConfig, backgroundKey?: string) => {
      if (!project) return;

      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }

      const projectId = project.id;

      persistTimerRef.current = setTimeout(() => {
        updateProjectDesign(projectId, {
          canvas,
          ...(backgroundKey !== undefined ? { backgroundKey } : {}),
        }).catch((error) => {
          console.log("debounced canvas save error:", error);
        });
      }, 300);
    },
    [project],
  );

  const saveCanvas = async (
    canvas: ProjectCanvasConfig,
    options?: { backgroundKey?: string },
  ) => {
    if (!project) return;

    setProject((prev) =>
      prev
        ? {
            ...prev,
            canvas,
            ...(options?.backgroundKey !== undefined
              ? { backgroundKey: options.backgroundKey }
              : {}),
          }
        : prev,
    );

    try {
      await updateProjectDesign(project.id, {
        canvas,
        ...(options?.backgroundKey !== undefined
          ? { backgroundKey: options.backgroundKey }
          : {}),
      });
    } catch (error) {
      console.log("saveCanvas error:", error);
      loadProject();
    }
  };

  const updateCanvasLocally = (
    canvas: ProjectCanvasConfig,
    options?: { backgroundKey?: string },
  ) => {
    if (!project) return;

    setProject((prev) =>
      prev
        ? {
            ...prev,
            canvas,
            ...(options?.backgroundKey !== undefined
              ? { backgroundKey: options.backgroundKey }
              : {}),
          }
        : prev,
    );

    queueCanvasPersist(canvas, options?.backgroundKey);
  };

  const onStampDragEnd = (layerId: string, x: number, y: number) => {
    if (!project) return;

    const stampLayers = project.canvas.stampLayers.map((layer) =>
      layer.id === layerId ? { ...layer, x, y } : layer,
    );

    saveCanvas({ ...project.canvas, stampLayers });
  };

  const onAssetDragEnd = (layerId: string, x: number, y: number) => {
    if (!project) return;

    const assetLayers = project.canvas.assetLayers.map((layer) =>
      layer.id === layerId ? { ...layer, x, y } : layer,
    );

    saveCanvas({ ...project.canvas, assetLayers });
  };

  const onTextDragEnd = (layerId: string, x: number, y: number) => {
    if (!project) return;

    const textLayers = project.canvas.textLayers.map((layer) =>
      layer.id === layerId ? { ...layer, x, y } : layer,
    );

    setSelectedTextLayerId(layerId);
    saveCanvas({ ...project.canvas, textLayers });
  };

  const onChangeBackground = (backgroundKey: string) => {
    if (!project) return;

    const existing = getBackgroundLayer(project.canvas);
    const otherAssets = project.canvas.assetLayers.filter(
      (layer) => layer.id !== BACKGROUND_LAYER_ID,
    );

    const backgroundLayer = buildBackgroundLayer(backgroundKey, existing);

    const updatedCanvas: ProjectCanvasConfig = {
      ...project.canvas,
      assetLayers: [backgroundLayer, ...otherAssets],
    };

    saveCanvas(updatedCanvas, { backgroundKey });
  };

  const onAddAsset = (assetKey: string) => {
    if (!project) return;

    const newLayer: AssetLayer = {
      id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      assetKey,
      x: 0.25 + Math.random() * 0.25,
      y: 0.25 + Math.random() * 0.25,
      scale: 1,
      rotation: 0,
      z: getMaxZ(project.canvas) + 1,
    };

    const updatedCanvas: ProjectCanvasConfig = {
      ...project.canvas,
      assetLayers: [...project.canvas.assetLayers, newLayer],
    };

    saveCanvas(updatedCanvas);
  };

  const onAddText = (fontKey: FontKey) => {
    if (!project) return;

    const newLayer: TextLayer = {
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: "Your text",
      fontKey,
      fontSize: 24,
      color: "#4f4a47",
      x: 0.15,
      y: 0.06,
      rotation: 0,
      z: getMaxZ(project.canvas) + 1,
    };

    const updatedCanvas: ProjectCanvasConfig = {
      ...project.canvas,
      textLayers: [...project.canvas.textLayers, newLayer],
    };

    setSelectedTextLayerId(newLayer.id);
    saveCanvas(updatedCanvas);
  };

  const onSelectTextLayer = (layerId: string) => {
    setSelectedTextLayerId(layerId);
  };

  const onTextPress = (layerId: string) => {
    setSelectedTextLayerId(layerId);
    setActiveTab("text");
  };

  const onChangeSelectedText = (text: string) => {
    if (!project || !selectedTextLayerId) return;

    const textLayers = project.canvas.textLayers.map((layer) =>
      layer.id === selectedTextLayerId ? { ...layer, text } : layer,
    );

    updateCanvasLocally({ ...project.canvas, textLayers });
  };

  const onChangeSelectedTextFont = (fontKey: FontKey) => {
    if (!project || !selectedTextLayerId) return;

    const textLayers = project.canvas.textLayers.map((layer) =>
      layer.id === selectedTextLayerId ? { ...layer, fontKey } : layer,
    );

    updateCanvasLocally({ ...project.canvas, textLayers });
  };

  const onDeleteSelectedText = () => {
    if (!project || !selectedTextLayerId) return;

    const textLayers = project.canvas.textLayers.filter(
      (layer) => layer.id !== selectedTextLayerId,
    );

    setSelectedTextLayerId(textLayers[0]?.id ?? null);
    saveCanvas({ ...project.canvas, textLayers });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text>Project not found.</Text>
      </View>
    );
  }

  const selectedTextLayer =
    project.canvas.textLayers.find((layer) => layer.id === selectedTextLayerId) ??
    null;

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable style={styles.circleButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#5f5a56" />
        </Pressable>

        <Text numberOfLines={1} style={styles.title}>
          {project.name}
        </Text>

        <Pressable
          style={styles.circleButton}
          onPress={() =>
            router.push(`/editor/select-stamps?projectId=${project.id}`)
          }
        >
          <Ionicons name="images-outline" size={22} color="#5f5a56" />
        </Pressable>
      </View>

      <View style={styles.canvasWrap}>
        <ProjectCanvas
          canvas={project.canvas}
          stamps={project.stamps}
          onStampDragEnd={onStampDragEnd}
          onAssetDragEnd={onAssetDragEnd}
          onTextDragEnd={onTextDragEnd}
          onTextPress={onTextPress}
          selectedTextLayerId={selectedTextLayerId}
        />
      </View>

      <View style={styles.toolbar}>
        <Pressable
          style={styles.toolBtn}
          onPress={() => {
            setActiveTab("backgrounds");
            setSheetOpen(true);
          }}
        >
          <Ionicons name="image-outline" size={22} color="#5f5a56" />
          <Text style={styles.toolLabel}>BG</Text>
        </Pressable>

        <Pressable
          style={styles.toolBtn}
          onPress={() => {
            setActiveTab("assets");
            setSheetOpen(true);
          }}
        >
          <Ionicons name="sparkles-outline" size={22} color="#5f5a56" />
          <Text style={styles.toolLabel}>Assets</Text>
        </Pressable>

        <Pressable
          style={styles.toolBtn}
          onPress={() => {
            setActiveTab("text");
            setSheetOpen(true);
          }}
        >
          <Ionicons name="text-outline" size={22} color="#5f5a56" />
          <Text style={styles.toolLabel}>Text</Text>
        </Pressable>
      </View>

      <EditorOptionsSheet
        visible={sheetOpen}
        activeTab={activeTab}
        onClose={() => setSheetOpen(false)}
        onChangeTab={setActiveTab}
        selectedBackground={getSelectedBackgroundKey(project)}
        onSelectBackground={onChangeBackground}
        onAddAsset={onAddAsset}
        onAddText={onAddText}
        textLayers={project.canvas.textLayers.map((layer) => ({
          id: layer.id,
          text: layer.text,
          fontKey: layer.fontKey,
        }))}
        selectedTextLayerId={selectedTextLayerId}
        selectedTextValue={selectedTextLayer?.text ?? ""}
        selectedTextFontKey={selectedTextLayer?.fontKey ?? null}
        onSelectTextLayer={onSelectTextLayer}
        onChangeSelectedText={onChangeSelectedText}
        onChangeSelectedTextFont={onChangeSelectedTextFont}
        onDeleteSelectedText={onDeleteSelectedText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f1ed",
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fbf8f5",
    borderWidth: 1,
    borderColor: "#e5ddd7",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#4f4a47",
  },
  canvasWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#e5ddd7",
    backgroundColor: "#fbf8f5",
  },
  toolBtn: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
    paddingVertical: 6,
  },
  toolLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#5f5a56",
  },
  center: {
    flex: 1,
    backgroundColor: "#f5f1ed",
    alignItems: "center",
    justifyContent: "center",
  },
});