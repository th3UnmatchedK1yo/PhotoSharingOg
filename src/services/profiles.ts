import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export async function upsertProfile(user: User) {
  const email = user.email ?? null;
  const displayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : email?.split("@")[0] ?? null;

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email,
      display_name: displayName,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}