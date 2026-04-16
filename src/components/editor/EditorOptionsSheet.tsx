import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  ASSET_SECTIONS,
  BACKGROUND_OPTIONS,
  FONT_OPTIONS,
} from "../../constants/editorCatalog";
import type { FontKey } from "../../types/project";

type TabKey = "backgrounds" | "assets" | "text";

type EditorOptionsSheetProps = {
  visible: boolean;
  activeTab: TabKey;
  onClose: () => void;
  onChangeTab: (tab: TabKey) => void;
  selectedBackground: string;
  onSelectBackground: (key: string) => void;
  onAddAsset: (assetKey: string) => void;
  onAddText: (fontKey: FontKey) => void;
};

export default function EditorOptionsSheet({
  visible,
  activeTab,
  onClose,
  onChangeTab,
  selectedBackground,
  onSelectBackground,
  onAddAsset,
  onAddText,
}: EditorOptionsSheetProps) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Pressable style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>

            <Text style={styles.title}>Edit Canvas</Text>

            <View style={styles.doneButtonPlaceholder} />
          </View>

          <View style={styles.segmented}>
            {(["backgrounds", "assets", "text"] as const).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.segmentItem, activeTab === tab && styles.segmentActive]}
                onPress={() => onChangeTab(tab)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    activeTab === tab && styles.segmentTextActive,
                  ]}
                >
                  {tab === "backgrounds" ? "BG" : tab === "assets" ? "Assets" : "Text"}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === "backgrounds" && (
              <View>
                <Text style={styles.sectionTitle}>Backgrounds</Text>
                <View style={styles.optionGrid}>
                  {BACKGROUND_OPTIONS.map((item) => {
                    const active = selectedBackground === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        style={[styles.optionCard, active && styles.optionCardActive]}
                        onPress={() => onSelectBackground(item.key)}
                      >
                        <Image
                          source={item.source}
                          style={styles.bgPreview}
                          resizeMode="cover"
                        />
                        <Text style={styles.optionLabel}>{item.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {activeTab === "assets" &&
              ASSET_SECTIONS.map((section) => (
                <View key={section.title} style={styles.assetSection}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.assetGrid}>
                    {section.items.map((item) => (
                      <Pressable
                        key={item.key}
                        style={styles.assetCard}
                        onPress={() => onAddAsset(item.key)}
                      >
                        <Image
                          source={item.source}
                          style={styles.assetPreview}
                          resizeMode="contain"
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}

            {activeTab === "text" && (
              <View>
                <Text style={styles.sectionTitle}>Add Text</Text>
                {FONT_OPTIONS.map((font) => (
                  <Pressable
                    key={font.key}
                    style={styles.fontCard}
                    onPress={() => onAddText(font.key)}
                  >
                    <Text
                      style={[
                        styles.fontPreview,
                        { fontFamily: font.fontFamily },
                      ]}
                    >
                      {font.label}
                    </Text>
                    <Text style={styles.fontAction}>+ Add</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
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
    maxHeight: "70%",
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
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "#e8e2dd",
    borderRadius: 999,
    padding: 4,
    marginBottom: 18,
  },
  segmentItem: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: "#fff",
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6d6661",
  },
  segmentTextActive: {
    color: "#1f1b19",
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#7b746f",
    marginBottom: 14,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    width: "47%",
    backgroundColor: "#fbf8f5",
    borderRadius: 18,
    padding: 10,
    borderWidth: 2,
    borderColor: "#e5ddd7",
  },
  optionCardActive: {
    borderColor: "#7f7670",
  },
  bgPreview: {
    height: 90,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: "#ddd5cf",
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4f4a47",
  },
  assetSection: {
    marginBottom: 20,
  },
  assetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  assetCard: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: "#fbf8f5",
    borderWidth: 1,
    borderColor: "#e5ddd7",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  assetPreview: {
    width: 56,
    height: 56,
  },
  fontCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fbf8f5",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5ddd7",
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  fontPreview: {
    fontSize: 22,
    color: "#4f4a47",
  },
  fontAction: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5f5a56",
  },
});
