import { supabase } from "../lib/supabase";
import type { ProjectCanvasConfig } from "../types/project";
import type { Stamp } from "../types/stamp";
import type {
  FriendItem,
  FriendRequestItem,
  FriendshipRow,
  OutgoingFriendRequestItem,
  PublicProfile,
  SharedProjectDetail,
  SharedProjectFeedItem,
} from "../types/social";
import { getDayKey } from "../utils/date";

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

type SharedProjectFeedRpcRow = {
  id: string;
  ownerId: string;
  projectId: string;
  caption: string;
  createdAt: string;
  owner: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  project: {
    id: string;
    userId: string;
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    stampCount: number;
    previewImages: string[];
    backgroundKey: string;
    canvas: unknown;
  };
};

type SharedProjectDetailRpcRow = {
  id: string;
  ownerId: string;
  projectId: string;
  caption: string;
  createdAt: string;
  owner: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  project: {
    id: string;
    userId: string;
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    backgroundKey: string;
    canvas: unknown;
  };
  stamps: Array<{
    id: string;
    userId: string;
    imageUrl: string;
    cloudinaryPublicId: string | null;
    caption: string;
    capturedAt: string;
    createdAt: string;
  }>;
};

function parseBackgroundKey(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function normalizeLayerScale<T extends Record<string, unknown>>(layer: T) {
  if (!("scale" in layer)) {
    (layer as Record<string, unknown>).scale = 1;
  }
  return layer;
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

  const stampLayers = Array.isArray(raw.stampLayers)
    ? raw.stampLayers.map((layer) =>
        layer && typeof layer === "object"
          ? normalizeLayerScale(layer as Record<string, unknown>)
          : layer,
      )
    : [];

  const assetLayers = Array.isArray(raw.assetLayers)
    ? raw.assetLayers.map((layer) =>
        layer && typeof layer === "object"
          ? normalizeLayerScale(layer as Record<string, unknown>)
          : layer,
      )
    : [];

  const textLayers = Array.isArray(raw.textLayers)
    ? raw.textLayers.map((layer) =>
        layer && typeof layer === "object"
          ? normalizeLayerScale(layer as Record<string, unknown>)
          : layer,
      )
    : [];

  return {
    stampLayers: stampLayers as ProjectCanvasConfig["stampLayers"],
    assetLayers: assetLayers as ProjectCanvasConfig["assetLayers"],
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

function mapStampFromRpc(row: SharedProjectDetailRpcRow["stamps"][number]): Stamp {
  return {
    id: row.id,
    userId: row.userId,
    imageUrl: row.imageUrl,
    cloudinaryPublicId: row.cloudinaryPublicId,
    caption: row.caption ?? "",
    capturedAt: row.capturedAt,
    createdAt: row.createdAt,
    dayKey: getDayKey(row.capturedAt),
  };
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

export async function getMySharedProjectIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("shared_projects")
    .select("project_id")
    .eq("owner_id", userId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<{ project_id: string }>).map(
    (row) => row.project_id,
  );
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
  const { data, error } = await supabase.rpc("get_friends_shared_feed");

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as SharedProjectFeedRpcRow[];

  return rows.map((row) => ({
    id: row.id,
    ownerId: row.ownerId,
    projectId: row.projectId,
    caption: row.caption ?? "",
    createdAt: row.createdAt,
    owner: row.owner
      ? {
          id: row.owner.id,
          username: row.owner.username,
          displayName: row.owner.displayName,
          avatarUrl: row.owner.avatarUrl,
        }
      : null,
    project: {
      id: row.project.id,
      userId: row.project.userId,
      name: row.project.name,
      status: row.project.status,
      createdAt: row.project.createdAt,
      updatedAt: row.project.updatedAt,
      stampCount: row.project.stampCount ?? 0,
      previewImages: Array.isArray(row.project.previewImages)
        ? row.project.previewImages.filter(Boolean).slice(0, 3)
        : [],
      backgroundKey: parseBackgroundKey(row.project.backgroundKey),
      canvas: parseCanvasConfig(row.project.canvas),
    },
  }));
}

export async function getSharedProjectDetail(
  sharedProjectId: string,
): Promise<SharedProjectDetail | null> {
  const { data, error } = await supabase.rpc("get_shared_project_detail", {
    shared_project_id: sharedProjectId,
  });

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as SharedProjectDetailRpcRow;

  return {
    id: row.id,
    ownerId: row.ownerId,
    projectId: row.projectId,
    caption: row.caption ?? "",
    createdAt: row.createdAt,
    owner: row.owner
      ? {
          id: row.owner.id,
          username: row.owner.username,
          displayName: row.owner.displayName,
          avatarUrl: row.owner.avatarUrl,
        }
      : null,
    project: {
      id: row.project.id,
      userId: row.project.userId,
      name: row.project.name,
      status: row.project.status,
      createdAt: row.project.createdAt,
      updatedAt: row.project.updatedAt,
      backgroundKey: row.project.backgroundKey ?? "",
      canvas: parseCanvasConfig(row.project.canvas),
    },
    stamps: (row.stamps ?? []).map(mapStampFromRpc),
  };
}