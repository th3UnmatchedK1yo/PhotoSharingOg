import type { Stamp } from "./stamp";

export type ProjectLayout = "single" | "two" | "three" | "grid";
export type ProjectBackground = "paper" | "soft-paper" | "plain" | "grid";

export type ProjectCanvasConfig = {
  layout: ProjectLayout;
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
  backgroundKey: ProjectBackground;
  canvas: ProjectCanvasConfig;
};

export type Project = {
  id: string;
  userId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  backgroundKey: ProjectBackground;
  canvas: ProjectCanvasConfig;
  stamps: Stamp[];
};