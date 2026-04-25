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
  useWindowDimensions,
} from "react-native";
import StampFrame from "../../../components/stamp/StampFrame";
import BottomTabBar from "../../../components/shared/BottomTabBar";
import OverflowMenu from "../../../components/shared/OverFlowMenu";
import { COLORS } from "../../../constants/theme";
import { useAuth } from "../../../providers/AuthProvider";
import { getGroupedStamps } from "../../../services/stamps";
import type { Stamp } from "../../../types/stamp";
import { formatDayLabel } from "../../../utils/date";

export default function BookScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();

  const [grouped, setGrouped] = useState<Record<string, Stamp[]>>({});
  const [loading, setLoading] = useState(true);

  const titleSize = width < 390 ? 36 : 42;
  const previewSize = width < 390 ? 80 : 90;

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
    }, [loadData]),
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

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { fontSize: titleSize }]}>Collections</Text>
        <OverflowMenu onSignOut={onSignOut} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : dayKeys.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Your Book is empty</Text>

          <Pressable style={styles.addButton} onPress={() => router.push("/stamp")}>
            <Text style={styles.addButtonText}>Take your first stamp</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
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
                      <StampFrame uri={stamp.imageUrl} size={previewSize} />
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <BottomTabBar active="book" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    flex: 1,
    fontWeight: "700",
    color: COLORS.text,
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
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  addButtonText: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    marginBottom: 14,
  },
  dayLabel: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  countText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  previewRow: {
    flexDirection: "row",
    gap: 10,
  },
  previewItem: {
    flexShrink: 1,
  },
});