import { getOwnerEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getCommonplaceUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase() ?? null;
  const ownerEmail = getOwnerEmail()?.toLowerCase() ?? null;

  return {
    supabase,
    user,
    email,
    isOwner: Boolean(email && ownerEmail && email === ownerEmail),
  };
}
