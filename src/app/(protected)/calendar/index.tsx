import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import BottomTabBar from "../../../components/shared/BottomTabBar";
import OverflowMenu from "../../../components/shared/OverFlowMenu";
import { COLORS } from "../../../constants/theme";
import { useAuth } from "../../../providers/AuthProvider";
import { getGroupedStamps } from "../../../services/stamps";
import {
  formatMonthLabel,
  getMonthGrid,
  WEEKDAY_LABELS,
  type CalendarCell,
} from "../../../utils/date";

export default function CalendarScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [grouped, setGrouped] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getGroupedStamps(user.id);
      setGrouped(data);
    } catch (error) {
      console.log("getGroupedStamps error:", error);
      Alert.alert("Error", "Failed to load calendar data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const weeks = useMemo(() => getMonthGrid(monthDate), [monthDate]);

  const goPrevMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const onOpenDay = (cell: CalendarCell) => {
    if ((grouped[cell.dayKey]?.length ?? 0) > 0) {
      router.push(`/book/${cell.dayKey}`);
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

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Calendar</Text>
        <OverflowMenu onSignOut={onSignOut} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.monthRow}>
            <Pressable style={styles.monthButton} onPress={goPrevMonth}>
              <Text style={styles.monthButtonText}>‹</Text>
            </Pressable>

            <Text style={styles.monthLabel}>{formatMonthLabel(monthDate)}</Text>

            <Pressable style={styles.monthButton} onPress={goNextMonth}>
              <Text style={styles.monthButtonText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekdaysRow}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.weekdayText}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((cell) => {
                  const count = grouped[cell.dayKey]?.length ?? 0;
                  const hasStamps = count > 0;

                  return (
                    <Pressable
                      key={cell.dayKey}
                      style={[
                        styles.dayCell,
                        !cell.inCurrentMonth && styles.dayCellOutside,
                        hasStamps && styles.dayCellActive,
                      ]}
                      onPress={() => onOpenDay(cell)}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          !cell.inCurrentMonth && styles.dayNumberOutside,
                          hasStamps && styles.dayNumberActive,
                        ]}
                      >
                        {cell.dayNumber}
                      </Text>

                      {hasStamps ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{count}</Text>
                        </View>
                      ) : (
                        <View style={styles.badgePlaceholder} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <BottomTabBar active="calendar" />
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
    fontSize: 42,
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
    paddingBottom: 120,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  monthButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  monthButtonText: {
    fontSize: 28,
    fontWeight: "600",
    color: COLORS.text,
  },
  monthLabel: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  weekdayText: {
    width: "14%",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  grid: {
    gap: 10,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCell: {
    width: "14%",
    aspectRatio: 0.75,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 10,
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  dayCellOutside: {
    opacity: 0.35,
  },
  dayCellActive: {
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSoft,
  },
  dayNumberOutside: {
    color: COLORS.placeholder,
  },
  dayNumberActive: {
    color: COLORS.text,
  },
  badge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: "700",
  },
  badgePlaceholder: {
    height: 24,
  },
});