import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ASSET_SECTIONS,
  BACKGROUND_OPTIONS,
  FONT_OPTIONS,
} from "../../constants/editorCatalog";
import type { FontKey } from "../../types/project";

type TabKey = "backgrounds" | "assets" | "text";

type TextOption = {
  id: string;
  text: string;
  fontKey: FontKey;
};

type EditorOptionsSheetProps = {
  visible: boolean;
  activeTab: TabKey;
  onClose: () => void;
  onChangeTab: (tab: TabKey) => void;
  selectedBackground: string;
  onSelectBackground: (key: string) => void;
  onAddAsset: (assetKey: string) => void;
  onAddText: (fontKey: FontKey) => void;
  textLayers: TextOption[];
  selectedTextLayerId: string | null;
  selectedTextValue: string;
  selectedTextFontKey: FontKey | null;
  onSelectTextLayer: (layerId: string) => void;
  onChangeSelectedText: (text: string) => void;
  onChangeSelectedTextFont: (fontKey: FontKey) => void;
  onDeleteSelectedText: () => void;
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
  textLayers,
  selectedTextLayerId,
  selectedTextValue,
  selectedTextFontKey,
  onSelectTextLayer,
  onChangeSelectedText,
  onChangeSelectedTextFont,
  onDeleteSelectedText,
}: EditorOptionsSheetProps) {
  const hasSelectedText = Boolean(selectedTextLayerId);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
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
                style={[
                  styles.segmentItem,
                  activeTab === tab && styles.segmentActive,
                ]}
                onPress={() => onChangeTab(tab)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    activeTab === tab && styles.segmentTextActive,
                  ]}
                >
                  {tab === "backgrounds"
                    ? "BG"
                    : tab === "assets"
                      ? "Assets"
                      : "Text"}
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
                        style={[
                          styles.optionCard,
                          active && styles.optionCardActive,
                        ]}
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
                <View style={styles.textHeaderRow}>
                  <Text style={styles.sectionTitle}>Text Layers</Text>
                  <Text style={styles.helperText}>
                    Tap a layer to edit it
                  </Text>
                </View>

                <View style={styles.textLayerList}>
                  {textLayers.map((layer) => {
                    const active = layer.id === selectedTextLayerId;

                    return (
                      <Pressable
                        key={layer.id}
                        style={[
                          styles.textLayerChip,
                          active && styles.textLayerChipActive,
                        ]}
                        onPress={() => onSelectTextLayer(layer.id)}
                      >
                        <Text
                          numberOfLines={1}
                          style={styles.textLayerChipLabel}
                        >
                          {layer.text || "Text"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {hasSelectedText ? (
                  <View style={styles.editorCard}>
                    <Text style={styles.editorLabel}>Content</Text>
                    <TextInput
                      value={selectedTextValue}
                      onChangeText={onChangeSelectedText}
                      placeholder="Type your text"
                      placeholderTextColor="#9d948e"
                      style={styles.textInput}
                      multiline
                    />

                    <View style={styles.editorTopGap} />

                    <View style={styles.textActionsRow}>
                      <Text style={styles.editorLabel}>Font</Text>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={onDeleteSelectedText}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </Pressable>
                    </View>

                    {FONT_OPTIONS.map((font) => {
                      const active = selectedTextFontKey === font.key;

                      return (
                        <Pressable
                          key={font.key}
                          style={[
                            styles.fontCard,
                            active && styles.fontCardActive,
                          ]}
                          onPress={() => onChangeSelectedTextFont(font.key)}
                        >
                          <Text
                            style={[
                              styles.fontPreview,
                              { fontFamily: font.fontFamily },
                            ]}
                          >
                            {font.label}
                          </Text>
                          <Text style={styles.fontAction}>
                            {active ? "Selected" : "Use"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyTextEditor}>
                    <Text style={styles.emptyTextEditorTitle}>
                      Add a text layer
                    </Text>
                    <Text style={styles.emptyTextEditorText}>
                      Then tap it on the canvas or from this list to edit.
                    </Text>
                  </View>
                )}

                <View style={styles.addTextBlock}>
                  <Text style={styles.sectionTitle}>Add New Text</Text>

                  {FONT_OPTIONS.map((font) => (
                    <Pressable
                      key={`add-${font.key}`}
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
    maxHeight: "76%",
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
  textHeaderRow: {
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    color: "#938a84",
    marginBottom: 14,
  },
  textLayerList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  textLayerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fbf8f5",
    borderWidth: 1,
    borderColor: "#e5ddd7",
    maxWidth: "48%",
  },
  textLayerChipActive: {
    borderColor: "#7f7670",
    backgroundColor: "#fff",
  },
  textLayerChipLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4f4a47",
  },
  editorCard: {
    backgroundColor: "#fbf8f5",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5ddd7",
    padding: 14,
    marginBottom: 18,
  },
  editorLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5f5a56",
    marginBottom: 10,
  },
  textInput: {
    minHeight: 92,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5ddd7",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2f2b29",
    textAlignVertical: "top",
  },
  editorTopGap: {
    height: 16,
  },
  textActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff4f3",
    borderWidth: 1,
    borderColor: "#edd3cf",
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#a15d54",
  },
  emptyTextEditor: {
    backgroundColor: "#fbf8f5",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5ddd7",
    padding: 16,
    marginBottom: 18,
  },
  emptyTextEditorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4f4a47",
    marginBottom: 6,
  },
  emptyTextEditorText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#7c746e",
  },
  addTextBlock: {
    marginTop: 6,
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
  fontCardActive: {
    borderColor: "#7f7670",
    backgroundColor: "#fff",
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