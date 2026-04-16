import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type {
  ProjectBackground,
  ProjectLayout,
} from "../../types/project";

type TabKey = "backgrounds" | "layouts";

type EditorOptionsSheetProps = {
  visible: boolean;
  activeTab: TabKey;
  onClose: () => void;
  onChangeTab: (tab: TabKey) => void;
  selectedBackground: ProjectBackground;
  selectedLayout: ProjectLayout;
  onSelectBackground: (value: ProjectBackground) => void;
  onSelectLayout: (value: ProjectLayout) => void;
};

const BACKGROUNDS: Array<{ key: ProjectBackground; label: string }> = [
  { key: "paper", label: "Paper" },
  { key: "soft-paper", label: "Soft Paper" },
  { key: "plain", label: "Plain" },
  { key: "grid", label: "Grid" },
];

const LAYOUTS: Array<{ key: ProjectLayout; label: string }> = [
  { key: "single", label: "Single" },
  { key: "two", label: "Two" },
  { key: "three", label: "Three" },
  { key: "grid", label: "Grid" },
];

export default function EditorOptionsSheet({
  visible,
  activeTab,
  onClose,
  onChangeTab,
  selectedBackground,
  selectedLayout,
  onSelectBackground,
  onSelectLayout,
}: EditorOptionsSheetProps) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Pressable style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>

            <Text style={styles.title}>Edit Project</Text>

            <View style={styles.doneButtonPlaceholder} />
          </View>

          <View style={styles.segmented}>
            <Pressable
              style={[styles.segmentItem, activeTab === "backgrounds" && styles.segmentActive]}
              onPress={() => onChangeTab("backgrounds")}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTab === "backgrounds" && styles.segmentTextActive,
                ]}
              >
                Backgrounds
              </Text>
            </Pressable>

            <Pressable
              style={[styles.segmentItem, activeTab === "layouts" && styles.segmentActive]}
              onPress={() => onChangeTab("layouts")}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTab === "layouts" && styles.segmentTextActive,
                ]}
              >
                Layouts
              </Text>
            </Pressable>
          </View>

          {activeTab === "backgrounds" ? (
            <View>
              <Text style={styles.sectionTitle}>Project Background</Text>

              <View style={styles.optionGrid}>
                {BACKGROUNDS.map((item) => {
                  const active = selectedBackground === item.key;

                  return (
                    <Pressable
                      key={item.key}
                      style={[styles.optionCard, active && styles.optionCardActive]}
                      onPress={() => onSelectBackground(item.key)}
                    >
                      <View
                        style={[
                          styles.backgroundPreview,
                          item.key === "paper" && styles.bgPaper,
                          item.key === "soft-paper" && styles.bgSoftPaper,
                          item.key === "plain" && styles.bgPlain,
                          item.key === "grid" && styles.bgGrid,
                        ]}
                      />
                      <Text style={styles.optionLabel}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Canvas Layout</Text>

              <View style={styles.optionGrid}>
                {LAYOUTS.map((item) => {
                  const active = selectedLayout === item.key;

                  return (
                    <Pressable
                      key={item.key}
                      style={[styles.optionCard, active && styles.optionCardActive]}
                      onPress={() => onSelectLayout(item.key)}
                    >
                      <View style={styles.layoutPreview}>
                        <Text style={styles.layoutPreviewText}>{item.label}</Text>
                      </View>
                      <Text style={styles.optionLabel}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.12)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#f5f1ed",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    minHeight: 420,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  doneButton: {
    minWidth: 74,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#fbf8f5",
    borderWidth: 1,
    borderColor: "#e5ddd7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  doneButtonPlaceholder: {
    minWidth: 74,
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5f5a56",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "#e8e2dd",
    borderRadius: 999,
    padding: 4,
    marginBottom: 22,
  },
  segmentItem: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: "#fff",
  },
  segmentText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6d6661",
  },
  segmentTextActive: {
    color: "#1f1b19",
  },
  sectionTitle: {
    fontSize: 18,
    color: "#7b746f",
    marginBottom: 14,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  optionCard: {
    width: "47%",
    backgroundColor: "#fbf8f5",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5ddd7",
  },
  optionCardActive: {
    borderColor: "#7f7670",
  },
  backgroundPreview: {
    height: 94,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd5cf",
    marginBottom: 10,
  },
  bgPaper: {
    backgroundColor: "#f8f5f1",
  },
  bgSoftPaper: {
    backgroundColor: "#f1ebe3",
  },
  bgPlain: {
    backgroundColor: "#ffffff",
  },
  bgGrid: {
    backgroundColor: "#f9f6f2",
  },
  layoutPreview: {
    height: 94,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd5cf",
    marginBottom: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  layoutPreviewText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5f5a56",
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4f4a47",
  },
});