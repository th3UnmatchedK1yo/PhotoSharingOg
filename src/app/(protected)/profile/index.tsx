import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { COLORS } from "../../../constants/theme";
import { useAuth } from "../../../providers/AuthProvider";
import {
  getMyProfile,
  updateMyProfile,
  type MyProfile,
} from "../../../services/profiles";

function getInitial(profile: MyProfile | null, email?: string | null) {
  const source =
    profile?.displayName ||
    profile?.username ||
    email?.split("@")[0] ||
    "U";

  return source.charAt(0).toUpperCase();
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getMyProfile(user.id);
      setProfile(data);
      setDisplayName(data?.displayName ?? "");
      setUsername(data?.username ?? "");
    } catch (error) {
      console.log("getMyProfile error:", error);
      Alert.alert("Error", "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const onSave = async () => {
    if (!user || saving) return;

    try {
      setSaving(true);
      await updateMyProfile(user.id, { username, displayName });
      await loadProfile();
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (error: any) {
      console.log("updateMyProfile error:", error);
      Alert.alert("Error", error?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    try {
      await signOut();
      router.replace("/sign-in");
    } catch (error) {
      console.log("signOut error:", error);
      Alert.alert("Error", "Failed to sign out.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.textMuted} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <View />
        <Pressable style={styles.arrowButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={26} color={COLORS.textSoft} />
        </Pressable>
      </View>

      <View style={styles.avatarWrap}>
        {profile?.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {getInitial(profile, user?.email)}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.nameText}>
        {profile?.displayName || displayName || "Your Profile"}
      </Text>
      <Text style={styles.usernameText}>
        @{profile?.username || username || "set-username"}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your identity</Text>
        <Text style={styles.cardHint}>
          Friends will find you by your username, not your email.
        </Text>

        <Text style={styles.fieldLabel}>Display name</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your display name"
          placeholderTextColor={COLORS.placeholder}
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="username"
          placeholderTextColor={COLORS.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save profile"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.emailText}>{user?.email}</Text>

        <Pressable style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingTop: 46,
    paddingHorizontal: 22,
    paddingBottom: 36,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  arrowButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 18,
  },
  avatarImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.backgroundAlt,
  },
  avatarFallback: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    color: COLORS.text,
    fontSize: 54,
    fontWeight: "700",
  },
  nameText: {
    textAlign: "center",
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "700",
  },
  usernameText: {
    textAlign: "center",
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 28,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 18,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardHint: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 16,
  },
  fieldLabel: {
    color: COLORS.textSoft,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    paddingHorizontal: 16,
    fontSize: 17,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 14,
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: "700",
  },
  emailText: {
    color: COLORS.textMuted,
    fontSize: 16,
    marginBottom: 16,
  },
  signOutButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: {
    color: COLORS.danger,
    fontSize: 17,
    fontWeight: "700",
  },
});