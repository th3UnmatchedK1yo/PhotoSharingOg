import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
import { saveRemoteStamp } from "../../../services/stamps";

export default function ReviewScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);

  const previewSize = useMemo(() => {
    const base = Math.min(width - 80, 260);
    if (height < 750) {
      return Math.min(base, 210);
    }
    return base;
  }, [width, height]);

  const onSave = async () => {
    if (!uri || saving) return;

    if (!user) {
      Alert.alert("Not signed in", "Please sign in again.");
      router.replace("/sign-in");
      return;
    }

    try {
      setSaving(true);

      await saveRemoteStamp({
        userId: user.id,
        localUri: uri,
        title,
        caption,
      });

      router.replace("/book");
    } catch (error) {
      console.log("saveRemoteStamp error:", error);
      Alert.alert("Error", "Failed to upload and save stamp.");
    } finally {
      setSaving(false);
    }
  };

  if (!uri) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No photo found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.linkText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewArea}>
          <StampFrame uri={uri} size={previewSize} />
        </View>

        <View style={styles.formArea}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give it a title"
            placeholderTextColor="#a9a29d"
            style={styles.titleInput}
            returnKeyType="next"
          />

          <View style={styles.captionRow}>
            <Text style={styles.fieldLabel}>Note</Text>
            <Text style={styles.optionalText}>Optional</Text>
          </View>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a note..."
            placeholderTextColor="#a9a29d"
            multiline
            style={styles.noteInput}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.back()}
              disabled={saving}
            >
              <Text style={styles.secondaryBtnText}>Retake</Text>
            </Pressable>

            <Pressable
              style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
              onPress={onSave}
              disabled={saving}
            >
              <Text style={styles.primaryBtnText}>
                {saving ? "Saving..." : "Save to Book"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f1ed",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    backgroundColor: "#f5f1ed",
    alignItems: "center",
    justifyContent: "center",
  },
  previewArea: {
    alignItems: "center",
    marginBottom: 28,
  },
  formArea: {
    flex: 1,
  },
  fieldLabel: {
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
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 16,
    color: "#8c8682",
  },
  noteInput: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: "#ddd4ce",
    borderRadius: 20,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    color: "#333",
    marginBottom: 20,
  },
  actions: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    paddingBottom: 8,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#ece7e3",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  secondaryBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5f5a56",
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#5f5a56",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  errorText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 12,
  },
  linkText: {
    fontSize: 16,
    color: "#4c6ef5",
  },
});