import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import EditorOptionsSheet from "../../../components/editor/EditorOptionsSheet";
import ProjectCanvas from "../../../components/editor/ProjectCanvas";
import { COLORS } from "../../../constants/theme";
import { useAuth } from "../../../providers/AuthProvider";
import {
  getProject,
  saveProjectStamps,
  updateProjectDesign,
} from "../../../services/projects";
import { saveRemoteStamp } from "../../../services/stamps";
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

type LayerTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

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
    x: existing?.x ?? 0,
    y: existing?.y ?? 0,
    scale: 1,
    rotation: 0,
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
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SheetTab>("backgrounds");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedTextLayerId, setSelectedTextLayerId] = useState<string | null>(
    null,
  );

  const didReconcile = useRef(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasCaptureRef = useRef<View | null>(null);

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
      project.canvas.textLayers.some(
        (layer) => layer.id === selectedTextLayerId,
      )
    ) {
      return;
    }

    setSelectedTextLayerId(null);
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
      }, 180);
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

  const onStampTransformEnd = (layerId: string, next: LayerTransform) => {
    if (!project) return;

    const stampLayers = project.canvas.stampLayers.map((layer) =>
      layer.id === layerId ? { ...layer, ...next } : layer,
    );

    updateCanvasLocally({ ...project.canvas, stampLayers });
  };

  const onAssetTransformEnd = (layerId: string, next: LayerTransform) => {
    if (!project) return;

    const assetLayers = project.canvas.assetLayers.map((layer) =>
      layer.id === layerId ? { ...layer, ...next } : layer,
    );

    updateCanvasLocally({ ...project.canvas, assetLayers });
  };

  const onTextTransformEnd = (layerId: string, next: LayerTransform) => {
    if (!project) return;

    const textLayers = project.canvas.textLayers.map((layer) =>
      layer.id === layerId ? { ...layer, ...next } : layer,
    );

    setSelectedTextLayerId(layerId);
    updateCanvasLocally({ ...project.canvas, textLayers });
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

  const onAddUploadedImage = async () => {
    if (!project || !user || uploadingImage) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo access needed",
          "Allow photo access so you can add an image to the editor.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      setUploadingImage(true);
      const picked = result.assets[0];
      const newStamp = await saveRemoteStamp({
        userId: user.id,
        localUri: picked.uri,
        title: "",
        caption: "",
      });

      const newLayer: StampLayer = {
        id: `sl-${newStamp.id}`,
        stampId: newStamp.id,
        x: 0.18,
        y: 0.18,
        scale: 1,
        rotation: 0,
        z: getMaxZ(project.canvas) + 1,
      };

      const updatedCanvas: ProjectCanvasConfig = {
        ...project.canvas,
        stampLayers: [...project.canvas.stampLayers, newLayer],
      };
      const nextStampIds = [
        ...project.stamps.map((stamp) => stamp.id),
        newStamp.id,
      ];

      setProject((prev) =>
        prev
          ? {
              ...prev,
              stamps: [...prev.stamps, newStamp],
              canvas: updatedCanvas,
            }
          : prev,
      );

      await Promise.all([
        saveProjectStamps(project.id, nextStampIds),
        updateProjectDesign(project.id, { canvas: updatedCanvas }),
      ]);
    } catch (error) {
      console.log("editor upload image error:", error);
      Alert.alert("Error", "Failed to upload image as a stamp.");
      loadProject();
    } finally {
      setUploadingImage(false);
    }
  };

  const onAddText = (fontKey: FontKey) => {
    if (!project) return;

    const newLayer: TextLayer = {
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: "Your text",
      fontKey,
      fontSize: 24,
      color: COLORS.text,
      x: 0.15,
      y: 0.06,
      scale: 1,
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
    setSheetOpen(true);
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

  const onDeleteStampLayer = async (layerId: string) => {
    if (!project) return;

    const targetLayer = project.canvas.stampLayers.find(
      (layer) => layer.id === layerId,
    );
    if (!targetLayer) return;

    const stampLayers = project.canvas.stampLayers.filter(
      (layer) => layer.id !== layerId,
    );
    const nextStamps = project.stamps.filter(
      (stamp) => stamp.id !== targetLayer.stampId,
    );
    const updatedCanvas = { ...project.canvas, stampLayers };

    setProject((prev) =>
      prev
        ? {
            ...prev,
            stamps: nextStamps,
            canvas: updatedCanvas,
          }
        : prev,
    );

    try {
      await Promise.all([
        saveProjectStamps(
          project.id,
          nextStamps.map((stamp) => stamp.id),
        ),
        updateProjectDesign(project.id, { canvas: updatedCanvas }),
      ]);
    } catch (error) {
      console.log("delete stamp layer error:", error);
      Alert.alert("Error", "Failed to remove stamp from project.");
      loadProject();
    }
  };

  const onDeleteAssetLayer = (layerId: string) => {
    if (!project || layerId === BACKGROUND_LAYER_ID) return;

    const assetLayers = project.canvas.assetLayers.filter(
      (layer) => layer.id !== layerId,
    );

    saveCanvas({ ...project.canvas, assetLayers });
  };

  const onDeleteTextLayer = (layerId: string) => {
    if (!project) return;

    const textLayers = project.canvas.textLayers.filter(
      (layer) => layer.id !== layerId,
    );

    if (selectedTextLayerId === layerId) {
      setSelectedTextLayerId(textLayers[0]?.id ?? null);
    }

    saveCanvas({ ...project.canvas, textLayers });
  };

  const onDownloadCanvas = async () => {
    if (!canvasCaptureRef.current || downloading) return;

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo access needed",
          "Allow photo access so you can save the editor image to your library.",
        );
        return;
      }

      setDownloading(true);
      const uri = await captureRef(canvasCaptureRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Saved", "Your editor image was saved to your photo library.");
    } catch (error) {
      console.log("download canvas error:", error);
      Alert.alert("Error", "Failed to save the editor image.");
    } finally {
      setDownloading(false);
    }
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
    project.canvas.textLayers.find(
      (layer) => layer.id === selectedTextLayerId,
    ) ?? null;

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View style={styles.headerActions}>
          <Pressable style={styles.circleButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textSoft} />
          </Pressable>

          <Pressable
            style={styles.circleButton}
            onPress={onDownloadCanvas}
            disabled={downloading}
          >
            <Ionicons
              name={downloading ? "hourglass-outline" : "download-outline"}
              size={22}
              color={COLORS.textSoft}
            />
          </Pressable>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.circleButton}
            onPress={onAddUploadedImage}
            disabled={uploadingImage}
          >
            <Ionicons
              name={uploadingImage ? "hourglass-outline" : "image-outline"}
              size={22}
              color={COLORS.textSoft}
            />
          </Pressable>

          <Pressable
            style={styles.circleButton}
            onPress={() =>
              router.push(`/editor/select-stamps?projectId=${project.id}`)
            }
          >
            <Ionicons name="albums-outline" size={22} color={COLORS.textSoft} />
          </Pressable>

          <Pressable
            style={styles.circleButton}
            onPress={() => {
              setActiveTab("assets");
              setSheetOpen(true);
            }}
          >
            <Ionicons
              name="color-palette-outline"
              size={22}
              color={COLORS.textSoft}
            />
          </Pressable>
        </View>
      </View>

      <View ref={canvasCaptureRef} collapsable={false} style={styles.canvasWrap}>
        <ProjectCanvas
          canvas={project.canvas}
          stamps={project.stamps}
          onStampTransformEnd={onStampTransformEnd}
          onAssetTransformEnd={onAssetTransformEnd}
          onTextTransformEnd={onTextTransformEnd}
          onStampDoubleTap={onDeleteStampLayer}
          onAssetDoubleTap={onDeleteAssetLayer}
          onTextDoubleTap={onDeleteTextLayer}
          onTextPress={onTextPress}
          onCanvasPress={() => setSelectedTextLayerId(null)}
          selectedTextLayerId={selectedTextLayerId}
        />
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
    backgroundColor: COLORS.background,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  canvasWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
