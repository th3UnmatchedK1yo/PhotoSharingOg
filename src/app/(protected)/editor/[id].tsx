import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import EditorOptionsSheet from "../../../components/editor/EditorOptionsSheet";
import ProjectCanvas from "../../../components/editor/ProjectCanvas";
import { getProject, updateProjectDesign } from "../../../services/projects";
import type {
  Project,
  ProjectBackground,
  ProjectLayout,
} from "../../../types/project";

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"backgrounds" | "layouts">("backgrounds");

  const loadProject = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
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
    }, [loadProject])
  );

  const onChangeBackground = async (backgroundKey: ProjectBackground) => {
    if (!project) return;

    try {
      setProject((prev) =>
        prev ? { ...prev, backgroundKey } : prev
      );

      await updateProjectDesign(project.id, { backgroundKey });
    } catch (error) {
      console.log("updateProjectDesign background error:", error);
      Alert.alert("Error", "Failed to update background.");
      loadProject();
    }
  };

  const onChangeLayout = async (layout: ProjectLayout) => {
    if (!project) return;

    try {
      const canvas = { ...project.canvas, layout };

      setProject((prev) =>
        prev ? { ...prev, canvas } : prev
      );

      await updateProjectDesign(project.id, { canvas });
    } catch (error) {
      console.log("updateProjectDesign layout error:", error);
      Alert.alert("Error", "Failed to update layout.");
      loadProject();
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

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable style={styles.circleButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#5f5a56" />
        </Pressable>

        <Text numberOfLines={1} style={styles.title}>
          {project.name}
        </Text>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.circleButton}
            onPress={() => router.push(`/editor/select-stamps?projectId=${project.id}`)}
          >
            <Ionicons name="images-outline" size={22} color="#5f5a56" />
          </Pressable>

          <Pressable
            style={styles.circleButton}
            onPress={() => {
              setActiveTab("backgrounds");
              setSheetOpen(true);
            }}
          >
            <Ionicons name="options-outline" size={22} color="#5f5a56" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProjectCanvas
          backgroundKey={project.backgroundKey}
          canvas={project.canvas}
          stamps={project.stamps}
        />
      </ScrollView>

      <EditorOptionsSheet
        visible={sheetOpen}
        activeTab={activeTab}
        onClose={() => setSheetOpen(false)}
        onChangeTab={setActiveTab}
        selectedBackground={project.backgroundKey}
        selectedLayout={project.canvas.layout}
        onSelectBackground={onChangeBackground}
        onSelectLayout={onChangeLayout}
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
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  circleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fbf8f5",
    borderWidth: 1,
    borderColor: "#e5ddd7",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#4f4a47",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: "#f5f1ed",
    alignItems: "center",
    justifyContent: "center",
  },
});