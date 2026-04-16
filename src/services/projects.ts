import { supabase } from "../lib/supabase";
import type {
  Project,
  ProjectCanvasConfig,
  ProjectSummary,
} from "../types/project";
import type { Stamp } from "../types/stamp";
import { getDayKey } from "../utils/date";

type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  status: string;
  background_key: string | null;
  canvas_json: unknown;
  created_at: string;
  updated_at: string;
};

type StampRow = {
  id: string;
  user_id: string;
  image_url: string;
  cloudinary_public_id: string | null;
  caption: string | null;
  captured_at: string;
  created_at: string;
};

function mapStamp(row: StampRow): Stamp {
  return {
    id: row.id,
    userId: row.user_id,
    imageUrl: row.image_url,
    cloudinaryPublicId: row.cloudinary_public_id,
    caption: row.caption ?? "",
    capturedAt: row.captured_at,
    createdAt: row.created_at,
    dayKey: getDayKey(row.captured_at),
  };
}

function parseBackgroundKey(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

const EMPTY_CANVAS: ProjectCanvasConfig = {
  stampLayers: [],
  assetLayers: [],
  textLayers: [],
};

function parseCanvasConfig(value: unknown): ProjectCanvasConfig {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_CANVAS };
  }

  const raw = value as Record<string, unknown>;

  return {
    stampLayers: Array.isArray(raw.stampLayers) ? raw.stampLayers : [],
    assetLayers: Array.isArray(raw.assetLayers) ? raw.assetLayers : [],
    textLayers: Array.isArray(raw.textLayers) ? raw.textLayers : [],
  };
}

function mapProject(row: ProjectRow, stamps: Stamp[]): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    backgroundKey: parseBackgroundKey(row.background_key),
    canvas: parseCanvasConfig(row.canvas_json),
    stamps,
  };
}

async function getProjectStamps(projectId: string): Promise<Stamp[]> {
  const { data, error } = await supabase
    .from("project_stamps")
    .select(
      `
      stamp_id,
      stamps (
        id,
        user_id,
        image_url,
        cloudinary_public_id,
        caption,
        captured_at,
        created_at
      )
      `,
    )
    .eq("project_id", projectId);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row: any) => row.stamps)
    .filter(Boolean)
    .map((row: StampRow) => mapStamp(row));
}

export async function createProject(userId: string, name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Project name is required.");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: trimmed,
      status: "draft",
      background_key: "",
      canvas_json: { stampLayers: [], assetLayers: [], textLayers: [] },
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as ProjectRow;
}

export async function deleteProject(projectId: string) {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    throw error;
  }
}

export async function getProjects(userId: string): Promise<ProjectSummary[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as ProjectRow[];

  const summaries = await Promise.all(
    rows.map(async (row) => {
      const stamps = await getProjectStamps(row.id);

      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        stampCount: stamps.length,
        previewImages: stamps.slice(0, 3).map((stamp) => stamp.imageUrl),
        backgroundKey: parseBackgroundKey(row.background_key),
        canvas: parseCanvasConfig(row.canvas_json),
      } satisfies ProjectSummary;
    }),
  );

  return summaries;
}

export async function getProject(projectId: string): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    throw error;
  }

  const row = data as ProjectRow;
  const stamps = await getProjectStamps(projectId);

  return mapProject(row, stamps);
}

export async function saveProjectStamps(projectId: string, stampIds: string[]) {
  const { error: deleteError } = await supabase
    .from("project_stamps")
    .delete()
    .eq("project_id", projectId);

  if (deleteError) {
    throw deleteError;
  }

  if (stampIds.length > 0) {
    const rows = stampIds.map((stampId) => ({
      project_id: projectId,
      stamp_id: stampId,
    }));

    const { error: insertError } = await supabase
      .from("project_stamps")
      .insert(rows);

    if (insertError) {
      throw insertError;
    }
  }

  const { error: updateError } = await supabase
    .from("projects")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (updateError) {
    throw updateError;
  }
}

export async function updateProjectDesign(
  projectId: string,
  payload: {
    backgroundKey?: string;
    canvas?: ProjectCanvasConfig;
  },
) {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.backgroundKey !== undefined) {
    updateData.background_key = payload.backgroundKey;
  }

  if (payload.canvas !== undefined) {
    updateData.canvas_json = payload.canvas;
  }

  const { error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", projectId);

  if (error) {
    throw error;
  }
}