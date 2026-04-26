import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
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
import { COLORS } from "../../../constants/theme";
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
  const previewEnterProgress = useRef(new Animated.Value(0)).current;

  const previewSize = useMemo(() => {
    const maxByWidth = width - 80;
    const maxPreview = height < 760 ? 235 : 285;

    return Math.min(maxByWidth, maxPreview);
  }, [width, height]);

  useEffect(() => {
    previewEnterProgress.setValue(0);

    Animated.timing(previewEnterProgress, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [previewEnterProgress, uri]);

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
        <Animated.View
          style={[
            styles.previewArea,
            {
              opacity: previewEnterProgress,
              transform: [
                {
                  translateY: previewEnterProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
                {
                  scale: previewEnterProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <StampFrame uri={uri} size={previewSize} />
        </Animated.View>

        <View style={styles.formArea}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give it a title"
            placeholderTextColor={COLORS.placeholder}
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
            placeholderTextColor={COLORS.placeholder}
            multiline
            style={styles.noteInput}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.replace("/stamp")}
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 42,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  previewArea: {
    alignItems: "center",
    marginBottom: 26,
  },
  formArea: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textSoft,
    marginBottom: 8,
  },
  titleInput: {
    height: 58,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 18,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 18,
  },
  captionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  noteInput: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    color: COLORS.text,
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
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  secondaryBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textSoft,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primaryText,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 16,
    color: COLORS.primary,
  },
});