import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) console.warn("Supabase not configured — offline mode");

export const supabase = createClient(url ?? "", key ?? "");
export const supabaseReady = Boolean(url && key);
