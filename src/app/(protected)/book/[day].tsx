import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import StampFrame from "../../../components/stamp/StampFrame";
import { COLORS } from "../../../constants/theme";
import { useAuth } from "../../../providers/AuthProvider";
import { getStampsByDay } from "../../../services/stamps";
import type { Stamp } from "../../../types/stamp";
import { formatDayLabel } from "../../../utils/date";

export default function DayScreen() {
  const { day } = useLocalSearchParams<{ day?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);

  const numColumns = width < 390 ? 2 : 3;
  const horizontalPadding = 16 * 2;
  const gap = 14;
  const itemWidth = Math.floor(
    (width - horizontalPadding - gap * (numColumns - 1)) / numColumns,
  );

  const loadDay = useCallback(async () => {
    if (!day || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getStampsByDay(user.id, day);
      setStamps(data);
    } catch (error) {
      console.log("getStampsByDay error:", error);
      Alert.alert("Error", "Failed to load day stamps.");
    } finally {
      setLoading(false);
    }
  }, [day, user]);

  useFocusEffect(
    useCallback(() => {
      loadDay();
    }, [loadDay]),
  );

  if (!day) {
    return (
      <View style={styles.center}>
        <Text>Missing day.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.circleButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textSoft} />
        </Pressable>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{formatDayLabel(day)}</Text>
          <Text style={styles.subtitle}>{stamps.length} stamps</Text>
        </View>

        <View style={styles.circleButtonGhost} />
      </View>

      <FlatList
        data={stamps}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={styles.list}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        renderItem={({ item }) => {
          const visibleTitle = item.title?.trim() || item.caption?.trim() || "Untitled";

          return (
            <Pressable
              style={[styles.stampItem, { width: itemWidth }]}
              onPress={() => router.push(`/book-stamp/${item.id}`)}
            >
              <StampFrame uri={item.imageUrl} size={itemWidth} />
              <Text numberOfLines={1} style={styles.itemTitle}>
                {visibleTitle}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No stamps in this day yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
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
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
  list: {
    paddingBottom: 40,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 18,
  },
  stampItem: {
    alignItems: "center",
  },
  itemTitle: {
    marginTop: 10,
    fontSize: 15,
    color: COLORS.textSoft,
    textAlign: "center",
    width: "100%",
  },
  emptyWrap: {
    paddingTop: 30,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
});