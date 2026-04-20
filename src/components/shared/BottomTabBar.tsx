import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type TabKey = "stamp" | "book" | "editor" | "calendar" | "friends";

type BottomTabBarProps = {
  active: TabKey;
};

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}> = [
  { key: "stamp", label: "Stamp", icon: "star", route: "/stamp" },
  { key: "book", label: "Collection", icon: "book", route: "/book" },
  { key: "editor", label: "Editor", icon: "color-palette", route: "/editor" },
  { key: "calendar", label: "Calendar", icon: "calendar", route: "/calendar" },
  { key: "friends", label: "Friends", icon: "people", route: "/friends" },
];

export default function BottomTabBar({ active }: BottomTabBarProps) {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;

          return (
            <Pressable
              key={tab.key}
              style={[styles.item, isActive && styles.itemActive]}
              onPress={() => {
                if (!isActive) {
                  router.replace(tab.route);
                }
              }}
            >
              <Ionicons
                name={tab.icon}
                size={22}
                color={isActive ? "#1f1b19" : "#7a736e"}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
  },
  bar: {
    flexDirection: "row",
    backgroundColor: "#fbf8f5",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5ddd7",
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  item: {
    flex: 1,
    minHeight: 72,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  itemActive: {
    backgroundColor: "#ece7e3",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7a736e",
  },
  labelActive: {
    color: "#1f1b19",
  },
});