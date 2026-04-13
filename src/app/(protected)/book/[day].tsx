import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import StampFrame from "../../../components/stamp/StampFrame";
import { getStampsByDay } from "../../../services/stamps";
import { Stamp } from "../../../types/stamp";
import { formatDayLabel } from "../../../utils/date";

export default function DayScreen() {
  const { day } = useLocalSearchParams<{ day?: string }>();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!day) return;

      try {
        setLoading(true);
        const data = await getStampsByDay(day);
        setStamps(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [day]);

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
      <Text style={styles.title}>{formatDayLabel(day)}</Text>
      <Text style={styles.subtitle}>{stamps.length} stamps</Text>

      <FlatList
        data={stamps}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <StampFrame uri={item.uri} size={100} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f1ed",
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    backgroundColor: "#f5f1ed",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#4f4a47",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#827a75",
    textAlign: "center",
    marginBottom: 18,
  },
  list: {
    paddingBottom: 40,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
});