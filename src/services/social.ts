import { supabase } from "../lib/supabase";
import type { ProjectCanvasConfig, ProjectSummary } from "../types/project";
import type {
  FriendItem,
  FriendRequestItem,
  FriendshipRow,
  OutgoingFriendRequestItem,
  PublicProfile,
  SharedProjectFeedItem,
} from "../types/social";

type FriendshipDbRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  updated_at: string;
};

type PublicProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

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

type SharedProjectRow = {
  id: string;
  owner_id: string;
  project_id: string;
  caption: string | null;
  created_at: string;
  projects: ProjectRow | null;
};

type ProjectStampRow = {
  project_id: string;
  stamps: {
    image_url: string;
  } | null;
};

function parseBackgroundKey(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function parseCanvasConfig(value: unknown): ProjectCanvasConfig {
  if (!value || typeof value !== "object") {
    return {
      stampLayers: [],
      assetLayers: [],
      textLayers: [],
    };
  }

  const raw = value as Record<string, unknown>;
  const rawTextLayers = Array.isArray(raw.textLayers) ? raw.textLayers : [];

  const textLayers = rawTextLayers.map((layer) => {
    if (layer && typeof layer === "object") {
      const record = layer as Record<string, unknown>;
      if (!("scale" in record)) {
        record.scale = 1;
      }
    }
    return layer;
  });

  return {
    stampLayers: Array.isArray(raw.stampLayers) ? raw.stampLayers : [],
    assetLayers: Array.isArray(raw.assetLayers) ? raw.assetLayers : [],
    textLayers: textLayers as ProjectCanvasConfig["textLayers"],
  };
}

function mapPublicProfile(row: PublicProfileRow): PublicProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  };
}

function mapFriendship(row: FriendshipDbRow): FriendshipRow {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function groupPreviewImages(rows: ProjectStampRow[]) {
  const map = new Map<string, string[]>();

  for (const row of rows) {
    const current = map.get(row.project_id) ?? [];
    if (row.stamps?.image_url) {
      current.push(row.stamps.image_url);
    }
    map.set(row.project_id, current);
  }

  return map;
}

async function getPublicProfilesByIds(userIds: string[]) {
  const uniqueIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueIds.length === 0) {
    return new Map<string, PublicProfile>();
  }

  const { data, error } = await supabase.rpc("get_public_profiles", {
    profile_ids: uniqueIds,
  });

  if (error) {
    throw error;
  }

  const map = new Map<string, PublicProfile>();
  for (const row of (data ?? []) as PublicProfileRow[]) {
    map.set(row.id, mapPublicProfile(row));
  }

  return map;
}

async function getFriendshipRows(userId: string) {
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as FriendshipDbRow[]).map(mapFriendship);
}

export async function searchProfiles(query: string) {
  const { data, error } = await supabase.rpc("search_public_profiles", {
    search_text: query.trim(),
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as PublicProfileRow[]).map(mapPublicProfile);
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  if (requesterId === addresseeId) {
    throw new Error("You cannot add yourself.");
  }

  const { data: existingData, error: existingError } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`,
    )
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const existing = existingData as FriendshipDbRow | null;

  if (existing) {
    if (existing.status === "accepted") {
      return;
    }

    if (existing.status === "blocked") {
      throw new Error("This user cannot be added right now.");
    }

    if (existing.status === "pending") {
      if (existing.addressee_id === requesterId) {
        const { error } = await supabase
          .from("friendships")
          .update({
            status: "accepted",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          throw error;
        }

        return;
      }

      return;
    }
  }

  const { error } = await supabase.from("friendships").insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: "pending",
  });

  if (error) {
    throw error;
  }
}

export async function acceptFriendRequest(friendshipId: string) {
  const { error } = await supabase
    .from("friendships")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", friendshipId);

  if (error) {
    throw error;
  }
}

export async function declineFriendRequest(friendshipId: string) {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    throw error;
  }
}

export async function cancelOutgoingFriendRequest(friendshipId: string) {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    throw error;
  }
}

export async function getIncomingFriendRequests(
  userId: string,
): Promise<FriendRequestItem[]> {
  const rows = await getFriendshipRows(userId);
  const incoming = rows.filter(
    (row) => row.status === "pending" && row.addresseeId === userId,
  );

  const profileMap = await getPublicProfilesByIds(
    incoming.map((row) => row.requesterId),
  );

  return incoming.map((row) => ({
    friendshipId: row.id,
    requesterId: row.requesterId,
    requester: profileMap.get(row.requesterId) ?? null,
    createdAt: row.createdAt,
  }));
}

export async function getOutgoingFriendRequests(
  userId: string,
): Promise<OutgoingFriendRequestItem[]> {
  const rows = await getFriendshipRows(userId);
  const outgoing = rows.filter(
    (row) => row.status === "pending" && row.requesterId === userId,
  );

  const profileMap = await getPublicProfilesByIds(
    outgoing.map((row) => row.addresseeId),
  );

  return outgoing.map((row) => ({
    friendshipId: row.id,
    addresseeId: row.addresseeId,
    addressee: profileMap.get(row.addresseeId) ?? null,
    createdAt: row.createdAt,
  }));
}

export async function getAcceptedFriends(userId: string): Promise<FriendItem[]> {
  const rows = await getFriendshipRows(userId);
  const accepted = rows.filter((row) => row.status === "accepted");

  const otherUserIds = accepted.map((row) =>
    row.requesterId === userId ? row.addresseeId : row.requesterId,
  );

  const profileMap = await getPublicProfilesByIds(otherUserIds);

  return accepted.map((row) => {
    const otherUserId =
      row.requesterId === userId ? row.addresseeId : row.requesterId;

    return {
      friendshipId: row.id,
      userId: otherUserId,
      user: profileMap.get(otherUserId) ?? null,
    };
  });
}

export async function getOutgoingPendingUserIds(userId: string) {
  const rows = await getFriendshipRows(userId);
  return rows
    .filter((row) => row.status === "pending" && row.requesterId === userId)
    .map((row) => row.addresseeId);
}

export async function shareProject(
  ownerId: string,
  projectId: string,
  caption = "",
) {
  const { error } = await supabase.from("shared_projects").upsert(
    {
      owner_id: ownerId,
      project_id: projectId,
      caption: caption.trim() || null,
    },
    { onConflict: "project_id" },
  );

  if (error) {
    throw error;
  }
}

export async function unshareProject(projectId: string) {
  const { error } = await supabase
    .from("shared_projects")
    .delete()
    .eq("project_id", projectId);

  if (error) {
    throw error;
  }
}

export async function getSharedFeed(): Promise<SharedProjectFeedItem[]> {
  const { data, error } = await supabase
    .from("shared_projects")
    .select(
      `
      id,
      owner_id,
      project_id,
      caption,
      created_at,
      projects (
        id,
        user_id,
        name,
        status,
        background_key,
        canvas_json,
        created_at,
        updated_at
      )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as SharedProjectRow[];

  const validRows = rows.filter((row) => row.projects);
  const ownerIds = validRows.map((row) => row.owner_id);
  const projectIds = validRows.map((row) => row.project_id);

  const [profileMap, stampResult] = await Promise.all([
    getPublicProfilesByIds(ownerIds),
    supabase
      .from("project_stamps")
      .select(
        `
        project_id,
        stamps (
          image_url
        )
        `,
      )
      .in("project_id", projectIds),
  ]);

  if (stampResult.error) {
    throw stampResult.error;
  }

  const previewMap = groupPreviewImages(
    (stampResult.data ?? []) as unknown as ProjectStampRow[],
  );

  return validRows.map((row) => {
    const project = row.projects as ProjectRow;
    const previewImages = (previewMap.get(project.id) ?? []).slice(0, 3);
    const stampCount = previewMap.get(project.id)?.length ?? 0;

    const projectSummary: ProjectSummary = {
      id: project.id,
      userId: project.user_id,
      name: project.name,
      status: project.status,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      stampCount,
      previewImages,
      backgroundKey: parseBackgroundKey(project.background_key),
      canvas: parseCanvasConfig(project.canvas_json),
    };

    return {
      id: row.id,
      ownerId: row.owner_id,
      projectId: row.project_id,
      caption: row.caption ?? "",
      createdAt: row.created_at,
      owner: profileMap.get(row.owner_id) ?? null,
      project: projectSummary,
    };
  });
}