import { supabase } from "../lib/supabase";
import type { Stamp } from "../types/stamp";
import { getDayKey } from "../utils/date";
import { uploadStampImage } from "./upload";

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

export async function saveRemoteStamp(params: {
  userId: string;
  localUri: string;
  caption: string;
}): Promise<Stamp> {
  const uploaded = await uploadStampImage(params.localUri);
  const capturedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("stamps")
    .insert({
      user_id: params.userId,
      image_url: uploaded.imageUrl,
      cloudinary_public_id: uploaded.publicId,
      caption: params.caption.trim() || null,
      captured_at: capturedAt,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapStamp(data as StampRow);
}

export async function getMyStamps(userId: string): Promise<Stamp[]> {
  const { data, error } = await supabase
    .from("stamps")
    .select("*")
    .eq("user_id", userId)
    .order("captured_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as StampRow[]).map(mapStamp);
}

export async function getGroupedStamps(
  userId: string
): Promise<Record<string, Stamp[]>> {
  const stamps = await getMyStamps(userId);

  return stamps.reduce<Record<string, Stamp[]>>((groups, stamp) => {
    if (!groups[stamp.dayKey]) {
      groups[stamp.dayKey] = [];
    }
    groups[stamp.dayKey].push(stamp);
    return groups;
  }, {});
}

export async function getStampsByDay(
  userId: string,
  dayKey: string
): Promise<Stamp[]> {
  const stamps = await getMyStamps(userId);
  return stamps.filter((stamp) => stamp.dayKey === dayKey);
}