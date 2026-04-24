import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import StampFrame from "../../../components/stamp/StampFrame";
import { useAuth } from "../../../providers/AuthProvider";
import {
  deleteStamp,
  getStampById,
  updateStampDetails,
} from "../../../services/stamps";
import type { Stamp } from "../../../types/stamp";
import { formatDayLabel } from "../../../utils/date";

export default function BookStampDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();

  const [stamp, setStamp] = useState<Stamp | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const previewSize = useMemo(() => {
    const base = Math.min(250, Math.max(180, width - 140));
    if (height < 760) {
      return Math.min(base, 210);
    }
    return base;
  }, [width, height]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getStampById(user.id, id);

        if (!active) return;

        if (!data) {
          Alert.alert("Missing stamp", "This stamp is no longer available.");
          router.back();
          return;
        }

        setStamp(data);
        setTitle(data.title?.trim() || "");
        setCaption(data.caption || "");
      } catch (error) {
        console.log("getStampById error:", error);
        Alert.alert("Error", "Failed to load stamp.");
        router.back();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id, router, user]);

  const onSave = async () => {
    if (!user || !stamp || saving) return;

    try {
      setSaving(true);
      await updateStampDetails({
        userId: user.id,
        stampId: stamp.id,
        title,
        caption,
      });
      router.back();
    } catch (error) {
      console.log("updateStampDetails error:", error);
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!user || !stamp || deleting) return;

    Alert.alert("Delete stamp", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await deleteStamp({
              userId: user.id,
              stampId: stamp.id,
            });
            router.back();
          } catch (error) {
            console.log("deleteStamp error:", error);
            Alert.alert("Error", "Failed to delete stamp.");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading stamp...</Text>
      </View>
    );
  }

  if (!stamp) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Stamp not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.deletePill}
            onPress={onDelete}
            disabled={deleting || saving}
          >
            <Text style={styles.deletePillText}>
              {deleting ? "Deleting..." : "Delete"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.circleButton}
            onPress={() => router.back()}
            disabled={deleting || saving}
          >
            <Ionicons name="close" size={22} color="#5f5a56" />
          </Pressable>
        </View>

        <View style={styles.previewWrap}>
          <StampFrame uri={stamp.imageUrl} size={previewSize} />

          <View style={styles.dateChip}>
            <Text style={styles.dateChipText}>{formatDayLabel(stamp.dayKey)}</Text>
          </View>
        </View>

        <View style={styles.formWrap}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give it a title"
            placeholderTextColor="#b0a8a2"
            style={styles.titleInput}
            returnKeyType="next"
          />

          <View style={styles.captionRow}>
            <Text style={styles.label}>Note</Text>
            <Text style={styles.optionalText}>Optional</Text>
          </View>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a note..."
            placeholderTextColor="#b0a8a2"
            style={styles.captionInput}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomActions}>
          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={saving || deleting}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f1ed",
  },
  scrollContent: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 32,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    backgroundColor: "#f5f1ed",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6f6862",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  deletePill: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: "#fbf8f5",
    borderWidth: 1,
    borderColor: "#e5ddd7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  deletePillText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#c47761",
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
  previewWrap: {
    alignItems: "center",
    marginBottom: 28,
  },
  dateChip: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ece7e3",
  },
  dateChipText: {
    fontSize: 15,
    color: "#8a8079",
    fontWeight: "600",
  },
  formWrap: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5b5551",
    marginBottom: 8,
  },
  titleInput: {
    height: 58,
    borderWidth: 1,
    borderColor: "#ddd4ce",
    borderRadius: 18,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    fontSize: 18,
    color: "#333",
    marginBottom: 18,
  },
  captionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 16,
    color: "#8c8682",
  },
  captionInput: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: "#ddd4ce",
    borderRadius: 20,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    color: "#333",
  },
  bottomActions: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  saveButton: {
    height: 56,
    borderRadius: 22,
    backgroundColor: "#4a3d35",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
});