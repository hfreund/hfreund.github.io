import { NextResponse } from "next/server";

import { getCommonplaceUser } from "@/lib/commonplace/auth";
import { buildEntryInsert } from "@/lib/commonplace/entries";

type CreateEntryRequest = {
  input?: unknown;
  why_saved?: unknown;
};

export async function POST(request: Request) {
  const { supabase, isOwner } = await getCommonplaceUser();

  if (!isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as CreateEntryRequest;
  const input = typeof payload.input === "string" ? payload.input.trim() : "";
  const whySaved = typeof payload.why_saved === "string" ? payload.why_saved : null;

  if (!input) {
    return NextResponse.json({ error: "Add a URL or text to save." }, { status: 400 });
  }

  const entryInsert = buildEntryInsert(input, whySaved);
  const { data, error } = await supabase.from("entries").insert(entryInsert).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry: data }, { status: 201 });
}
