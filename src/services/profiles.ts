import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type MyProfile = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  setupCompleted: boolean;
};

type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  setup_completed: boolean | null;
};

function sanitizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/_{2,}/g, "_")
    .replace(/^[._]+|[._]+$/g, "");
}

function buildDefaultUsername(email: string | null, userId: string) {
  const emailBase = sanitizeUsername(email?.split("@")[0] ?? "");
  const base = emailBase || "user";
  return `${base}${userId.slice(0, 4).toLowerCase()}`;
}

function mapProfile(row: ProfileRow): MyProfile {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    setupCompleted: Boolean(row.setup_completed),
  };
}

export async function upsertProfile(user: User) {
  const email = user.email ?? null;
  const fallbackDisplayName =
    typeof user.user_metadata?.display_name === "string" &&
    user.user_metadata.display_name.trim()
      ? user.user_metadata.display_name.trim()
      : email?.split("@")[0] ?? "Friend";

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id, email, username, display_name, avatar_url, setup_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const row = existing as ProfileRow | null;
  const username = row?.username?.trim() || buildDefaultUsername(email, user.id);
  const displayName = row?.display_name?.trim() || fallbackDisplayName;

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email,
      username,
      display_name: displayName,
      avatar_url: row?.avatar_url ?? null,
      setup_completed: row?.setup_completed ?? false,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, display_name, avatar_url, setup_completed")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapProfile(data as ProfileRow);
}

export async function updateMyProfile(
  userId: string,
  payload: {
    username: string;
    displayName: string;
    setupCompleted?: boolean;
  }
) {
  const username = sanitizeUsername(payload.username);
  const displayName = payload.displayName.trim();

  if (!username) {
    throw new Error("Username is required.");
  }

  if (username.length < 3) {
    throw new Error("Username must be at least 3 characters.");
  }

  if (!displayName) {
    throw new Error("Display name is required.");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username,
      display_name: displayName,
      setup_completed: payload.setupCompleted ?? true,
    },
    { onConflict: "id" }
  );

  if (error) {
    if ((error as any).code === "23505") {
      throw new Error("That username is already taken.");
    }
    throw error;
  }
}