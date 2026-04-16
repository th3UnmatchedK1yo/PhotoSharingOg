import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import StampFrame from "../../../components/stamp/StampFrame";
import { useAuth } from "../../../providers/AuthProvider";
import { getProject, saveProjectStamps } from "../../../services/projects";
import { getMyStamps } from "../../../services/stamps";
import type { Stamp } from "../../../types/stamp";
import { formatDayLabel } from "../../../utils/date";

export default function SelectProjectStampsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();

  const [allStamps, setAllStamps] = useState<Stamp[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user || !projectId) return;

    try {
      setLoading(true);

      const [stamps, project] = await Promise.all([
        getMyStamps(user.id),
        getProject(projectId),
      ]);

      setAllStamps(stamps);
      setSelectedIds(project.stamps.map((stamp) => stamp.id));
    } catch (error) {
      console.log("select stamps load error:", error);
      Alert.alert("Error", "Failed to load stamps.");
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleStamp = (stampId: string) => {
    setSelectedIds((prev) =>
      prev.includes(stampId)
        ? prev.filter((id) => id !== stampId)
        : [...prev, stampId]
    );
  };

  const grouped = useMemo(() => {
    return allStamps.reduce<Record<string, Stamp[]>>((acc, stamp) => {
      if (!acc[stamp.dayKey]) {
        acc[stamp.dayKey] = [];
      }
      acc[stamp.dayKey].push(stamp);
      return acc;
    }, {});
  }, [allStamps]);

  const dayKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  const onDone = async () => {
    if (!projectId || saving) return;

    try {
      setSaving(true);
      await saveProjectStamps(projectId, selectedIds);
      router.replace(`/editor/${projectId}`);
    } catch (error) {
      console.log("saveProjectStamps error:", error);
      Alert.alert("Error", "Failed to save project stamps.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Close</Text>
        </Pressable>

        <Text style={styles.title}>Project Stamps</Text>

        <Pressable style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneButtonText}>{saving ? "Saving..." : "Done"}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {dayKeys.map((dayKey) => (
          <View key={dayKey} style={styles.groupCard}>
            {grouped[dayKey].map((stamp, index) => {
              const selected = selectedIds.includes(stamp.id);

              return (
                <Pressable
                  key={stamp.id}
                  style={[
                    styles.row,
                    index !== grouped[dayKey].length - 1 && styles.rowDivider,
                  ]}
                  onPress={() => toggleStamp(stamp.id)}
                >
                  <StampFrame uri={stamp.imageUrl} size={58} />

                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{formatDayLabel(stamp.dayKey)}</Text>
                    {!!stamp.caption && (
                      <Text numberOfLines={1} style={styles.rowSubtitle}>
                        {stamp.caption}
                      </Text>
                    )}
                  </View>

                  <View style={styles.checkWrap}>
                    <Ionicons
                      name={selected ? "checkmark-circle" : "ellipse-outline"}
                      size={26}
                      color={selected ? "#5f5a56" : "#b4ada8"}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
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
    justifyContent: "space-between",
    gap: 10,
  },
  doneButton: {
    minWidth: 74,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#fbf8f5",
    borderWidth: 1,
    borderColor: "#e5ddd7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5f5a56",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#4f4a47",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  groupCard: {
    backgroundColor: "#fbf8f5",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e5ddd7",
    overflow: "hidden",
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ece7e3",
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4f4a47",
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#7b746f",
  },
  checkWrap: {
    width: 32,
    alignItems: "flex-end",
  },
  center: {
    flex: 1,
    backgroundColor: "#f5f1ed",
    alignItems: "center",
    justifyContent: "center",
  },
});