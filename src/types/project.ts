import type { Stamp } from "./stamp";

export type FontKey =
  | "classic-serif"
  | "fz-kingshare"
  | "blosta-script"
  | "pinyon-script";

export type StampLayer = {
  id: string;
  stampId: string;
  x: number; // 0..1 relative to canvas width
  y: number; // 0..1 relative to canvas height
  scale: number;
  rotation: number;
  z: number;
};

export type AssetLayer = {
  id: string;
  assetKey: string;
  imageUri?: string;
  imageWidth?: number;
  imageHeight?: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z: number;
};

export type TextLayer = {
  id: string;
  text: string;
  fontKey: FontKey;
  fontSize: number;
  color: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z: number;
};

export type ProjectCanvasConfig = {
  stampLayers: StampLayer[];
  assetLayers: AssetLayer[];
  textLayers: TextLayer[];
};

export type ProjectSummary = {
  id: string;
  userId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  stampCount: number;
  previewImages: string[];
  backgroundKey: string;
  canvas: ProjectCanvasConfig;
};

export type Project = {
  id: string;
  userId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  backgroundKey: string;
  canvas: ProjectCanvasConfig;
  stamps: Stamp[];
};
