import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import {
  publicSupabaseAnonKey,
  publicSupabaseUrl,
  serviceRoleKey,
} from "./env";

/**
 * Supabase client for Server Components, Route Handlers and Server Actions.
 * Reads + writes the auth cookie so the user's session is honoured.
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    publicSupabaseUrl(),
    publicSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't mutate cookies — Next throws in
            // that case. The session refresh in middleware handles it.
          }
        },
      },
    },
  );
}

/**
 * Authenticated user + a server client, for pages/actions on protected
 * routes. The middleware (`updateSession`) already calls `auth.getUser()`
 * on every protected path, which validates the JWT against the auth server
 * and refreshes the cookie. So here we read the user from the session
 * **locally** (no extra network round-trip) — `getUser()` would re-validate
 * over the network on every navigation, which is a big chunk of the latency.
 * RLS still enforces real authorisation at the database.
 */
export async function getAuthedUser() {
  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { supabase, user: session?.user ?? null };
}

/**
 * Service-role client. Bypasses RLS. Only call from server code that
 * has already authorised the action (never from Client Components).
 */
export function getServiceRoleSupabase() {
  return createClient<Database>(publicSupabaseUrl(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
