import type { ImageSourcePropType } from "react-native";

type CatalogItem = { key: string; label: string; source: ImageSourcePropType };

export const BACKGROUND_OPTIONS: CatalogItem[] = [
  {
    key: "bg1",
    label: "Background 1",
    source: require("../assets/editor/backgrounds/bg1.png"),
  },
  {
    key: "bg2",
    label: "Background 2",
    source: require("../assets/editor/backgrounds/bg2.png"),
  },
  {
    key: "bg3",
    label: "Background 3",
    source: require("../assets/editor/backgrounds/bg3.png"),
  },
  {
    key: "bg4",
    label: "Background 4",
    source: require("../assets/editor/backgrounds/bg4.png"),
  },
  {
    key: "bg5",
    label: "Background 5",
    source: require("../assets/editor/backgrounds/bg5.png"),
  },
  {
    key: "bg6",
    label: "Background 6",
    source: require("../assets/editor/backgrounds/bg6.png"),
  },
];

export const ASSET_SECTIONS: Array<{ title: string; items: CatalogItem[] }> = [
  {
    title: "Tapes",
    items: [
      {
        key: "tape1",
        label: "Tape 1",
        source: require("../assets/editor/tapes/tape1.png"),
      },
      {
        key: "tape2",
        label: "Tape 2",
        source: require("../assets/editor/tapes/tape2.png"),
      },
      {
        key: "tape3",
        label: "Tape 3",
        source: require("../assets/editor/tapes/tape3.png"),
      },
      {
        key: "tape4",
        label: "Tape 4",
        source: require("../assets/editor/tapes/tape4.png"),
      },
      {
        key: "tape5",
        label: "Tape 5",
        source: require("../assets/editor/tapes/tape5.png"),
      },
      {
        key: "tape6",
        label: "Tape 6",
        source: require("../assets/editor/tapes/tape6.png"),
      },
      {
        key: "tape7",
        label: "Tape 7",
        source: require("../assets/editor/tapes/tape7.png"),
      },
      {
        key: "tape8",
        label: "Tape 8",
        source: require("../assets/editor/tapes/tape8.png"),
      },
      {
        key: "tape9",
        label: "Tape 9",
        source: require("../assets/editor/tapes/tape9.png"),
      },
      {
        key: "tape10",
        label: "Tape 10",
        source: require("../assets/editor/tapes/tape10.png"),
      },
      {
        key: "tape11",
        label: "Tape 11",
        source: require("../assets/editor/tapes/tape11.png"),
      },
      {
        key: "tape12",
        label: "Tape 12",
        source: require("../assets/editor/tapes/tape12.png"),
      },
      {
        key: "tape13",
        label: "Tape 13",
        source: require("../assets/editor/tapes/tape13.png"),
      },
      {
        key: "tape14",
        label: "Tape 14",
        source: require("../assets/editor/tapes/tape14.png"),
      },
      {
        key: "tape15",
        label: "Tape 15",
        source: require("../assets/editor/tapes/tape15.png"),
      },
    ],
  },
  {
    title: "Stickers",
    items: [
      {
        key: "sticker1",
        label: "Sticker 1",
        source: require("../assets/editor/stickers/sticker1.png"),
      },
      {
        key: "sticker2",
        label: "Sticker 2",
        source: require("../assets/editor/stickers/sticker2.png"),
      },
      {
        key: "sticker3",
        label: "Sticker 3",
        source: require("../assets/editor/stickers/sticker3.png"),
      },
      {
        key: "sticker4",
        label: "Sticker 4",
        source: require("../assets/editor/stickers/sticker4.png"),
      },
      {
        key: "sticker5",
        label: "Sticker 5",
        source: require("../assets/editor/stickers/sticker5.png"),
      },
      {
        key: "sticker6",
        label: "Sticker 6",
        source: require("../assets/editor/stickers/sticker6.png"),
      },
      {
        key: "sticker7",
        label: "Sticker 7",
        source: require("../assets/editor/stickers/sticker7.png"),
      },
      {
        key: "sticker8",
        label: "Sticker 8",
        source: require("../assets/editor/stickers/sticker8.png"),
      },
      {
        key: "sticker9",
        label: "Sticker 9",
        source: require("../assets/editor/stickers/sticker9.png"),
      },
      {
        key: "sticker10",
        label: "Sticker 10",
        source: require("../assets/editor/stickers/sticker10.png"),
      },
      {
        key: "sticker11",
        label: "Sticker 11",
        source: require("../assets/editor/stickers/sticker11.png"),
      },
      {
        key: "sticker12",
        label: "Sticker 12",
        source: require("../assets/editor/stickers/sticker12.png"),
      },
      {
        key: "sticker13",
        label: "Sticker 13",
        source: require("../assets/editor/stickers/sticker13.png"),
      },
      {
        key: "sticker14",
        label: "Sticker 14",
        source: require("../assets/editor/stickers/sticker14.png"),
      },
      {
        key: "sticker15",
        label: "Sticker 15",
        source: require("../assets/editor/stickers/sticker15.png"),
      },
      {
        key: "sticker16",
        label: "Sticker 16",
        source: require("../assets/editor/stickers/sticker16.png"),
      },
      {
        key: "sticker17",
        label: "Sticker 17",
        source: require("../assets/editor/stickers/sticker17.png"),
      },
      {
        key: "sticker18",
        label: "Sticker 18",
        source: require("../assets/editor/stickers/sticker18.png"),
      },
      {
        key: "sticker19",
        label: "Sticker 19",
        source: require("../assets/editor/stickers/sticker19.png"),
      },
      {
        key: "sticker20",
        label: "Sticker 20",
        source: require("../assets/editor/stickers/sticker20.png"),
      },
      {
        key: "sticker21",
        label: "Sticker 21",
        source: require("../assets/editor/stickers/sticker21.png"),
      },
      {
        key: "sticker22",
        label: "Sticker 22",
        source: require("../assets/editor/stickers/sticker22.png"),
      },
      {
        key: "sticker23",
        label: "Sticker 23",
        source: require("../assets/editor/stickers/sticker23.png"),
      },
    ],
  },
];

export const FONT_OPTIONS = [
  {
    key: "classic-serif" as const,
    label: "Classic Serif",
    fontFamily: "serif",
  },
  {
    key: "fz-kingshare" as const,
    label: "Kingshare",
    fontFamily: "FzKingshare",
  },
];

const bgMap: Record<string, ImageSourcePropType> = {};
for (const bg of BACKGROUND_OPTIONS) {
  bgMap[bg.key] = bg.source;
}
export const BACKGROUND_MAP = bgMap;

const assetMap: Record<string, ImageSourcePropType> = {};
for (const section of ASSET_SECTIONS) {
  for (const item of section.items) {
    assetMap[item.key] = item.source;
  }
}
export const ASSET_MAP = assetMap;
