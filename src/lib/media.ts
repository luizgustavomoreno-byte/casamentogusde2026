import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, { url: string; exp: number }>();

export async function signedUrl(path: string, expires = 3600): Promise<string> {
  const now = Date.now();
  const cached = cache.get(path);
  if (cached && cached.exp > now + 60_000) return cached.url;
  const { data, error } = await supabase.storage
    .from("memories")
    .createSignedUrl(path, expires);
  if (error || !data) throw error ?? new Error("signed url failed");
  cache.set(path, { url: data.signedUrl, exp: now + expires * 1000 });
  return data.signedUrl;
}

export function initials(name: string): string {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function firstName(name: string): string {
  return (name || "convidado").trim().split(/\s+/)[0].toLowerCase();
}

export const MOMENT_LABEL: Record<string, string> = {
  ceremonia: "⛪ cerimônia",
  festa: "🥂 festa",
  pista: "💃 pista",
};
