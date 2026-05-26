"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/env";

export function createClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabasePublishableKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Missing Supabase browser environment variables.");
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
