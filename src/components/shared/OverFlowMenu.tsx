import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type OverflowMenuProps = {
  onSignOut: () => void;
};

export default function OverflowMenu({ onSignOut }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Ionicons name="ellipsis-horizontal" size={22} color="#5f5a56" />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.menuCard} onPress={() => {}}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                close();
                onSignOut();
              }}
            >
              <Text style={styles.menuItemText}>Sign out</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fbf8f5",
    borderWidth: 1,
    borderColor: "#e5ddd7",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    paddingTop: 92,
    paddingRight: 24,
    alignItems: "flex-end",
  },
  menuCard: {
    minWidth: 170,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5ddd7",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: "hidden",
  },
  menuItem: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#c63b33",
  },
});