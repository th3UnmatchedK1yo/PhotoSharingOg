import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, SHADOWS } from "../../constants/theme";

type OverflowMenuProps = {
  onSignOut: () => void;
};

export default function OverflowMenu({ onSignOut }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textSoft} />
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    paddingTop: 92,
    paddingRight: 24,
    alignItems: "flex-end",
  },
  menuCard: {
    minWidth: 170,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    overflow: "hidden",
  },
  menuItem: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.danger,
  },
});