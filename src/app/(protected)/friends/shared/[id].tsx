import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
} from "react-native";
import ProjectCanvasReadOnly from "../../../../components/editor/ProjectCanvasReadOnly";
import { COLORS } from "../../../../constants/theme";
import { getSharedProjectDetail } from "../../../../services/social";
import type { PublicProfile, SharedProjectDetail } from "../../../../types/social";

function formatProfileName(profile: PublicProfile | null) {
  if (!profile) return "Unknown";
  return profile.displayName || profile.username || "Unknown";
}

function formatProfileHandle(profile: PublicProfile | null) {
  if (!profile?.username) return "";
  return `@${profile.username}`;
}

function getInitial(profile: PublicProfile | null) {
  const source = profile?.displayName || profile?.username || "U";
  return source.charAt(0).toUpperCase();
}

function ProfileAvatar({
  profile,
  size = 52,
}: {
  profile: PublicProfile | null;
  size?: number;
}) {
  if (profile?.avatarUrl) {
    return (
      <Image
        source={{ uri: profile.avatarUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.backgroundAlt,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: COLORS.primaryText,
          fontWeight: "700",
          fontSize: Math.max(16, size * 0.34),
        }}
      >
        {getInitial(profile)}
      </Text>
    </View>
  );
}

export default function SharedProjectViewerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<SharedProjectDetail | null>(null);

  const loadDetail = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getSharedProjectDetail(id);

      if (!data) {
        Alert.alert("Unavailable", "This shared project is no longer available.");
        router.back();
        return;
      }

      setDetail(data);
    } catch (error) {
      console.log("getSharedProjectDetail error:", error);
      Alert.alert("Error", "Failed to load shared project.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      loadDetail();
    }, [loadDetail]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Shared project not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable style={styles.circleButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textSoft} />
        </Pressable>

        <Text numberOfLines={1} style={styles.title}>
          Shared Project
        </Text>

        <View style={styles.circleButtonGhost} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ownerCard}>
          <ProfileAvatar profile={detail.owner} />

          <View style={styles.ownerMeta}>
            <Text style={styles.ownerName}>{formatProfileName(detail.owner)}</Text>
            {!!formatProfileHandle(detail.owner) && (
              <Text style={styles.ownerHandle}>
                {formatProfileHandle(detail.owner)}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.projectName}>{detail.project.name}</Text>

        {!!detail.caption && (
          <Text style={styles.caption}>{detail.caption}</Text>
        )}

        <View style={styles.canvasWrap}>
          <ProjectCanvasReadOnly
            canvas={detail.project.canvas}
            stamps={detail.stamps}
          />
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>Project details</Text>
          <Text style={styles.metaText}>
            {detail.stamps.length} stamp{detail.stamps.length === 1 ? "" : "s"}
          </Text>
          <Text style={styles.metaText}>Shared privately with friends only</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  circleButtonGhost: {
    width: 48,
    height: 48,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  ownerMeta: {
    flex: 1,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  ownerHandle: {
    marginTop: 3,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  projectName: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  canvasWrap: {
    minHeight: 460,
    marginBottom: 16,
  },
  metaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  metaTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
  },
});