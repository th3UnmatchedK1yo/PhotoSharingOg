import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import StampFrame from "../../../components/stamp/StampFrame";
import { useAuth } from "../../../providers/AuthProvider";
import { saveRemoteStamp } from "../../../services/stamps";

export default function ReviewScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const { user } = useAuth();

  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);

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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.previewArea}>
        <StampFrame uri={uri} size={240} />
      </View>

      <View style={styles.formArea}>
        <View style={styles.captionRow}>
          <Text style={styles.captionLabel}>Caption</Text>
          <Text style={styles.optionalText}>Optional</Text>
        </View>

        <Text style={styles.helperText}>
          A few words to keep the moment with the stamp.
        </Text>

        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="What do you see?"
          placeholderTextColor="#a9a29d"
          multiline
          style={styles.input}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f1ed",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 28,
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
  captionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  captionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5b5551",
  },
  optionalText: {
    fontSize: 16,
    color: "#8c8682",
  },
  helperText: {
    fontSize: 15,
    color: "#7b746f",
    marginBottom: 12,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#ddd4ce",
    borderRadius: 20,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    color: "#333",
    textAlignVertical: "top",
    marginBottom: 20,
  },
  actions: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
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