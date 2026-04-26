import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ASSET_SECTIONS,
  BACKGROUND_OPTIONS,
  FONT_OPTIONS,
} from "../../constants/editorCatalog";
import { COLORS } from "../../constants/theme";
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
  onAddUploadedImage: () => void;
  uploadingImage: boolean;
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
  onAddUploadedImage,
  uploadingImage,
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
  const { width } = useWindowDimensions();

  const isNarrow = width < 390;
  const cardWidth = Math.floor((width - 64) / 2);

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
            <Pressable
              style={[styles.doneButton, isNarrow && styles.doneButtonNarrow]}
              onPress={onClose}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>

            <Text
              numberOfLines={1}
              style={[styles.title, isNarrow && styles.titleNarrow]}
            >
              Edit Canvas
            </Text>

            <View
              style={[
                styles.doneButtonPlaceholder,
                isNarrow && styles.doneButtonNarrow,
              ]}
            />
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
                          { width: cardWidth },
                          active && styles.optionCardActive,
                        ]}
                        onPress={() => onSelectBackground(item.key)}
                      >
                        <Image
                          source={item.source}
                          style={styles.bgPreview}
                          resizeMode="cover"
                        />
                        <Text numberOfLines={1} style={styles.optionLabel}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {activeTab === "assets" && (
              <View>
                <Pressable
                  style={styles.uploadAssetCard}
                  onPress={onAddUploadedImage}
                  disabled={uploadingImage}
                >
                  <Text style={styles.uploadAssetTitle}>
                    {uploadingImage ? "Uploading..." : "Upload image"}
                  </Text>
                  <Text style={styles.uploadAssetText}>
                    Add a photo from your device to this canvas.
                  </Text>
                </Pressable>

                {ASSET_SECTIONS.map((section) => (
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
              </View>
            )}

            {activeTab === "text" && (
              <View>
                <View style={styles.textHeaderRow}>
                  <Text style={styles.sectionTitle}>Text Layers</Text>
                  <Text style={styles.helperText}>Tap a layer to edit it</Text>
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
                      placeholderTextColor={COLORS.placeholder}
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
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.background,
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
    gap: 8,
  },
  doneButton: {
    minWidth: 74,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  doneButtonNarrow: {
    minWidth: 64,
  },
  doneButtonPlaceholder: {
    minWidth: 74,
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSoft,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },
  titleNarrow: {
    fontSize: 20,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundAlt,
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
    backgroundColor: COLORS.surface,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  segmentTextActive: {
    color: COLORS.text,
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  optionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  optionCardActive: {
    borderColor: COLORS.primary,
  },
  bgPreview: {
    width: "100%",
    height: 90,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: COLORS.surfaceMuted,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  assetSection: {
    marginBottom: 20,
  },
  uploadAssetCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    padding: 16,
    marginBottom: 20,
  },
  uploadAssetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  uploadAssetText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textMuted,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.placeholder,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: "48%",
  },
  textLayerChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  textLayerChipLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  editorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 18,
  },
  editorLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSoft,
    marginBottom: 10,
  },
  textInput: {
    minHeight: 92,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
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
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.dangerSoft,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.danger,
  },
  emptyTextEditor: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 18,
  },
  emptyTextEditorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyTextEditorText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
  addTextBlock: {
    marginTop: 6,
  },
  fontCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  fontCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  fontPreview: {
    fontSize: 22,
    color: COLORS.text,
  },
  fontAction: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSoft,
  },
});
