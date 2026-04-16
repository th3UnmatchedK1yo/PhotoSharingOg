import { useFocusEffect, useRouter } from "expo-router";
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
import StampFrame from "../../../components/stamp/StampFrame";
import { useAuth } from "../../../providers/AuthProvider";
import { getGroupedStamps } from "../../../services/stamps";
import type { Stamp } from "../../../types/stamp";
import { formatDayLabel } from "../../../utils/date";

export default function BookScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [grouped, setGrouped] = useState<Record<string, Stamp[]>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getGroupedStamps(user.id);
      setGrouped(data);
    } catch (error) {
      console.log("getGroupedStamps error:", error);
      Alert.alert("Error", "Failed to load stamps.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onSignOut = async () => {
    try {
      await signOut();
      router.replace("/sign-in");
    } catch (error) {
      console.log("signOut error:", error);
      Alert.alert("Error", "Failed to sign out.");
    }
  };

  const dayKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (dayKeys.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Your Book is empty</Text>
        <Pressable style={styles.addButton} onPress={() => router.push("/stamp")}>
          <Text style={styles.addButtonText}>Take your first stamp</Text>
        </Pressable>

        <Pressable style={styles.secondaryAction} onPress={onSignOut}>
          <Text style={styles.secondaryActionText}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Collections</Text>
        <Pressable onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      {dayKeys.map((dayKey) => {
        const stamps = grouped[dayKey];
        const previews = stamps.slice(0, 3);

        return (
          <Pressable
            key={dayKey}
            style={styles.card}
            onPress={() => router.push(`/book/${dayKey}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.dayLabel}>{formatDayLabel(dayKey)}</Text>
              <Text style={styles.countText}>{stamps.length} stamps</Text>
            </View>

            <View style={styles.previewRow}>
              {previews.map((stamp) => (
                <View key={stamp.id} style={styles.previewItem}>
                  <StampFrame uri={stamp.imageUrl} size={90} />
                </View>
              ))}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f1ed",
  },
  content: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: "#f5f1ed",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "700",
    color: "#4f4a47",
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5f5a56",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#4f4a47",
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "#5f5a56",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryAction: {
    marginTop: 16,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5f5a56",
  },
  card: {
    backgroundColor: "#fbf8f5",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e5ddd7",
  },
  cardHeader: {
    marginBottom: 14,
  },
  dayLabel: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4f4a47",
    marginBottom: 4,
  },
  countText: {
    fontSize: 16,
    color: "#827a75",
  },
  previewRow: {
    flexDirection: "row",
    gap: 12,
  },
  previewItem: {
    flexShrink: 1,
  },
});