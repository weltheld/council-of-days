"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { publicSupabaseAnonKey, publicSupabaseUrl } from "./env";

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserSupabase() {
  if (cached) return cached;
  cached = createBrowserClient<Database>(
    publicSupabaseUrl(),
    publicSupabaseAnonKey(),
  );
  return cached;
}
