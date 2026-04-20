import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../../providers/AuthProvider";
import { getMyProfile, updateMyProfile } from "../../../services/profiles";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const profile = await getMyProfile(user.id);

        if (!active) return;

        setDisplayName(profile?.displayName ?? "");
        setUsername(profile?.username ?? "");
      } catch (error) {
        console.log("getMyProfile(setup) error:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  const onContinue = async () => {
    if (!user || saving) return;

    try {
      setSaving(true);

      await updateMyProfile(user.id, {
        username,
        displayName,
        setupCompleted: true,
      });

      router.replace("/stamp");
    } catch (error: any) {
      console.log("updateMyProfile(setup) error:", error);
      Alert.alert("Error", error?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.kicker}>Welcome</Text>
        <Text style={styles.title}>Set up your identity</Text>
        <Text style={styles.subtitle}>
          Choose a display name and username so friends can find you in the app.
        </Text>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your display name"
          placeholderTextColor="#8f857d"
          style={styles.input}
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="username"
          placeholderTextColor="#8f857d"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Pressable
          style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
          onPress={onContinue}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? "Saving..." : "Continue"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  kicker: {
    color: "#f0b63f",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    color: "#b8aea8",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 28,
  },
  label: {
    color: "#f0b63f",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2c2724",
    backgroundColor: "#191513",
    color: "#fff",
    paddingHorizontal: 16,
    fontSize: 17,
    marginBottom: 8,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 20,
    backgroundColor: "#f0b63f",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#2e2415",
    fontSize: 18,
    fontWeight: "700",
  },
});