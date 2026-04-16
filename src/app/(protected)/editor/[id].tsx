import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
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

function reconcileStampLayers(
  stamps: Stamp[],
  existing: StampLayer[],
): StampLayer[] {
  const layerByStamp = new Map(existing.map((l) => [l.stampId, l]));
  const stampIds = new Set(stamps.map((s) => s.id));

  const kept = existing.filter((l) => stampIds.has(l.stampId));

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

type SheetTab = "backgrounds" | "assets" | "text";

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SheetTab>("backgrounds");

  const didReconcile = useRef(false);

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

  useFocusEffect(
    useCallback(() => {
      if (!project || didReconcile.current) return;
      didReconcile.current = true;

      const reconciled = reconcileStampLayers(
        project.stamps,
        project.canvas.stampLayers,
      );

      const changed =
        reconciled.length !== project.canvas.stampLayers.length ||
        reconciled.some(
          (l, i) => l.id !== project.canvas.stampLayers[i]?.id,
        );

      if (!changed) return;

      const updatedCanvas: ProjectCanvasConfig = {
        ...project.canvas,
        stampLayers: reconciled,
      };

      setProject((prev) => (prev ? { ...prev, canvas: updatedCanvas } : prev));

      updateProjectDesign(project.id, { canvas: updatedCanvas }).catch((err) =>
        console.log("reconcile save error:", err),
      );
    }, [project]),
  );

  const saveCanvas = async (canvas: ProjectCanvasConfig) => {
    if (!project) return;

    setProject((prev) => (prev ? { ...prev, canvas } : prev));

    try {
      await updateProjectDesign(project.id, { canvas });
    } catch (error) {
      console.log("saveCanvas error:", error);
    }
  };

  const onStampDragEnd = (layerId: string, x: number, y: number) => {
    if (!project) return;

    const stampLayers = project.canvas.stampLayers.map((l) =>
      l.id === layerId ? { ...l, x, y } : l,
    );

    saveCanvas({ ...project.canvas, stampLayers });
  };

  const onAssetDragEnd = (layerId: string, x: number, y: number) => {
    if (!project) return;

    const assetLayers = project.canvas.assetLayers.map((l) =>
      l.id === layerId ? { ...l, x, y } : l,
    );

    saveCanvas({ ...project.canvas, assetLayers });
  };

  const onChangeBackground = async (backgroundKey: string) => {
    if (!project) return;

    setProject((prev) => (prev ? { ...prev, backgroundKey } : prev));

    try {
      await updateProjectDesign(project.id, { backgroundKey });
    } catch (error) {
      console.log("background save error:", error);
      loadProject();
    }
  };

  const onAddAsset = (assetKey: string) => {
    if (!project) return;

    const maxZ = Math.max(
      0,
      ...project.canvas.stampLayers.map((l) => l.z),
      ...project.canvas.assetLayers.map((l) => l.z),
      ...project.canvas.textLayers.map((l) => l.z),
    );

    const newLayer: AssetLayer = {
      id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      assetKey,
      x: 0.25 + Math.random() * 0.25,
      y: 0.25 + Math.random() * 0.25,
      scale: 1,
      rotation: 0,
      z: maxZ + 1,
    };

    const updatedCanvas: ProjectCanvasConfig = {
      ...project.canvas,
      assetLayers: [...project.canvas.assetLayers, newLayer],
    };

    saveCanvas(updatedCanvas);
  };

  const onAddText = (fontKey: FontKey) => {
    if (!project) return;

    const maxZ = Math.max(
      0,
      ...project.canvas.stampLayers.map((l) => l.z),
      ...project.canvas.assetLayers.map((l) => l.z),
      ...project.canvas.textLayers.map((l) => l.z),
    );

    const newLayer: TextLayer = {
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: "Your text",
      fontKey,
      fontSize: 24,
      color: "#4f4a47",
      x: 0.15,
      y: 0.06,
      rotation: 0,
      z: maxZ + 1,
    };

    const updatedCanvas: ProjectCanvasConfig = {
      ...project.canvas,
      textLayers: [...project.canvas.textLayers, newLayer],
    };

    saveCanvas(updatedCanvas);
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
          backgroundKey={project.backgroundKey}
          canvas={project.canvas}
          stamps={project.stamps}
          onStampDragEnd={onStampDragEnd}
          onAssetDragEnd={onAssetDragEnd}
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
        selectedBackground={project.backgroundKey}
        onSelectBackground={onChangeBackground}
        onAddAsset={onAddAsset}
        onAddText={onAddText}
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
