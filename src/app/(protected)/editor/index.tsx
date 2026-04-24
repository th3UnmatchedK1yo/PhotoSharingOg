import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import BottomTabBar from "../../../components/shared/BottomTabBar";
import StampFrame from "../../../components/stamp/StampFrame";
import { useAuth } from "../../../providers/AuthProvider";
import {
  createProject,
  deleteProject,
  getProjects,
} from "../../../services/projects";
import {
  getMySharedProjectIds,
  shareProject,
  unshareProject,
} from "../../../services/social";
import type { ProjectSummary } from "../../../types/project";

export default function EditorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  const [sharedProjectIds, setSharedProjectIds] = useState<string[]>([]);
  const [sharingProjectId, setSharingProjectId] = useState<string | null>(null);

  const isNarrow = width < 390;
  const titleSize = width < 360 ? 34 : isNarrow ? 38 : 42;
  const headerButtonSize = isNarrow ? 48 : 56;
  const cardActionSize = isNarrow ? 38 : 42;
  const previewSize = width < 360 ? 74 : 82;
  const projectTitleSize = width < 360 ? 24 : 28;

  const loadProjects = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [projectData, mySharedIds] = await Promise.all([
        getProjects(user.id),
        getMySharedProjectIds(user.id),
      ]);

      setProjects(projectData);
      setSharedProjectIds(mySharedIds);
    } catch (error) {
      console.log("getProjects/getMySharedProjectIds error:", error);
      Alert.alert("Error", "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects]),
  );

  const sharedSet = useMemo(() => new Set(sharedProjectIds), [sharedProjectIds]);

  const onCreateProject = async () => {
    if (!user || creating) return;

    const trimmed = projectName.trim();
    if (!trimmed) {
      Alert.alert("Missing name", "Please enter a project name.");
      return;
    }

    try {
      setCreating(true);
      const created = await createProject(user.id, trimmed);
      setCreateOpen(false);
      setProjectName("");
      router.push(`/editor/${created.id}`);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  const onDeleteProject = (projectId: string) => {
    Alert.alert("Delete project", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProject(projectId);
            setSharedProjectIds((prev) => prev.filter((id) => id !== projectId));
            loadProjects();
          } catch (error) {
            console.log("deleteProject error:", error);
            Alert.alert("Error", "Failed to delete project.");
          }
        },
      },
    ]);
  };

  const onToggleShareProject = async (project: ProjectSummary) => {
    if (!user || sharingProjectId) return;

    const isShared = sharedSet.has(project.id);

    try {
      setSharingProjectId(project.id);

      if (isShared) {
        await unshareProject(project.id);
        setSharedProjectIds((prev) => prev.filter((id) => id !== project.id));
      } else {
        await shareProject(
          user.id,
          project.id,
          `${project.name} · ${project.stampCount} stamp${project.stampCount === 1 ? "" : "s"}`,
        );
        setSharedProjectIds((prev) =>
          prev.includes(project.id) ? prev : [...prev, project.id],
        );
      }
    } catch (error) {
      console.log("toggle share project error:", error);
      Alert.alert(
        "Error",
        isShared ? "Failed to unshare project." : "Failed to share project.",
      );
    } finally {
      setSharingProjectId(null);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.title, { fontSize: titleSize }]}>Editor</Text>
          <Text style={styles.subtitle}>
            Build scrapbook projects and choose which ones your friends can see.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={[
              styles.headerCircle,
              { width: headerButtonSize, height: headerButtonSize, borderRadius: headerButtonSize / 2 },
            ]}
            onPress={() => router.push("/friends")}
          >
            <Ionicons name="people-outline" size={22} color="#5f5a56" />
          </Pressable>

          <Pressable
            style={[
              styles.headerCircle,
              { width: headerButtonSize, height: headerButtonSize, borderRadius: headerButtonSize / 2 },
            ]}
            onPress={() => setCreateOpen(true)}
          >
            <Ionicons name="add" size={24} color="#5f5a56" />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Projects</Text>

          {projects.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptyText}>
                Create your first scrapbook project from your saved stamps.
              </Text>
            </View>
          ) : (
            projects.map((project) => {
              const isShared = sharedSet.has(project.id);
              const isUpdatingShare = sharingProjectId === project.id;

              return (
                <View key={project.id} style={styles.projectCard}>
                  <View style={styles.projectTopRow}>
                    <View style={styles.projectStatusWrap}>
                      <Text style={styles.projectStatus}>Active</Text>
                      {isShared && (
                        <View style={styles.sharedPill}>
                          <Ionicons name="people" size={12} color="#5f5a56" />
                          <Text style={styles.sharedPillText}>Shared</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.projectActions}>
                      <Text style={styles.projectCount}>{project.stampCount}</Text>

                      <Pressable
                        style={[
                          styles.cardAction,
                          {
                            width: cardActionSize,
                            height: cardActionSize,
                            borderRadius: cardActionSize / 2,
                          },
                          isShared && styles.cardActionShared,
                        ]}
                        onPress={() => onToggleShareProject(project)}
                        disabled={isUpdatingShare}
                      >
                        <Ionicons
                          name={isShared ? "people" : "people-outline"}
                          size={18}
                          color="#7b746f"
                        />
                      </Pressable>

                      <Pressable
                        style={[
                          styles.cardAction,
                          {
                            width: cardActionSize,
                            height: cardActionSize,
                            borderRadius: cardActionSize / 2,
                          },
                        ]}
                        onPress={() => onDeleteProject(project.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#7b746f"
                        />
                      </Pressable>

                      <Pressable
                        style={[
                          styles.cardAction,
                          {
                            width: cardActionSize,
                            height: cardActionSize,
                            borderRadius: cardActionSize / 2,
                          },
                        ]}
                        onPress={() => router.push(`/editor/${project.id}`)}
                      >
                        <Ionicons name="arrow-forward" size={18} color="#7b746f" />
                      </Pressable>
                    </View>
                  </View>

                  <Text style={[styles.projectName, { fontSize: projectTitleSize }]}>
                    {project.name}
                  </Text>

                  <Text style={styles.projectMeta}>
                    {project.stampCount} stamps
                    {isUpdatingShare
                      ? " · Saving..."
                      : isShared
                        ? " · Visible to friends"
                        : " · Private"}
                  </Text>

                  <View style={styles.previewBox}>
                    {project.previewImages.length === 0 ? (
                      <Text style={styles.previewPlaceholder}>
                        No stamps selected yet
                      </Text>
                    ) : (
                      <View style={styles.previewRow}>
                        {project.previewImages.slice(0, 3).map((imageUrl, index) => (
                          <View
                            key={`${project.id}-${index}`}
                            style={styles.previewThumb}
                          >
                            <StampFrame uri={imageUrl} size={previewSize} />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.shareRow}>
                    <Ionicons
                      name={isShared ? "lock-closed" : "lock-closed-outline"}
                      size={15}
                      color="#847b75"
                    />
                    <Text style={styles.shareRowText}>
                      {isShared
                        ? "Shared only with accepted friends in your app."
                        : "This project is private to you."}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <BottomTabBar active="editor" />

      <Modal transparent visible={createOpen} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Project</Text>
            <Text style={styles.modalText}>
              Create a project to design your scrapbook canvas.
            </Text>

            <TextInput
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Project name"
              placeholderTextColor="#9b948e"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setCreateOpen(false);
                  setProjectName("");
                }}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalPrimaryBtn}
                onPress={onCreateProject}
                disabled={creating}
              >
                <Text style={styles.modalPrimaryText}>
                  {creating ? "Creating..." : "Create"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    fontWeight: "700",
    color: "#4f4a47",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#7b746f",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  headerCircle: {
    backgroundColor: "#fbf8f5",
    borderWidth: 1,
    borderColor: "#e5ddd7",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 120,
  },
  sectionLabel: {
    fontSize: 18,
    color: "#7b746f",
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: "#fbf8f5",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5ddd7",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4f4a47",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#7b746f",
  },
  projectCard: {
    backgroundColor: "#fbf8f5",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5ddd7",
    marginBottom: 18,
  },
  projectTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  projectStatusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  projectStatus: {
    fontSize: 14,
    color: "#8c8682",
  },
  sharedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ede7e3",
  },
  sharedPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5f5a56",
  },
  projectActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  projectCount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#7b746f",
    minWidth: 12,
    textAlign: "center",
  },
  cardAction: {
    borderWidth: 1,
    borderColor: "#e5ddd7",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardActionShared: {
    backgroundColor: "#ece7e3",
  },
  projectName: {
    fontWeight: "700",
    color: "#4f4a47",
    marginTop: 8,
  },
  projectMeta: {
    fontSize: 16,
    color: "#827a75",
    marginTop: 4,
    marginBottom: 14,
  },
  previewBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5ddd7",
    backgroundColor: "#fff",
    padding: 14,
    minHeight: 130,
    justifyContent: "center",
    overflow: "hidden",
  },
  previewRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  previewThumb: {
    flexShrink: 0,
  },
  previewPlaceholder: {
    fontSize: 15,
    color: "#8c8682",
  },
  shareRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shareRowText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#847b75",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#666",
    marginBottom: 16,
  },
  input: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#f1eeeb",
    paddingHorizontal: 18,
    fontSize: 18,
    color: "#333",
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#f1eeeb",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5f5a56",
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#d8d3cf",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5f5a56",
  },
});