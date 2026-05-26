import Link from "next/link";

import { getOwnerEmail, hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

async function getUserEmail() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.email?.toLowerCase() ?? null;
}

export default async function CommonplacePage() {
  const userEmail = await getUserEmail();
  const ownerEmail = getOwnerEmail()?.toLowerCase();
  const isOwner = Boolean(userEmail && ownerEmail && userEmail === ownerEmail);

  return (
    <main className="commonplace-page">
      <div className="commonplace-shell">
        <header className="commonplace-header">
          <div>
            <p className="commonplace-eyebrow">Commonplace</p>
            <h1 className="commonplace-title">Taste and knowledge base</h1>
          </div>
          <p className="commonplace-session">
            {isOwner ? `Owner mode: ${userEmail}` : userEmail ? `Public mode: ${userEmail}` : "Public mode"}
          </p>
        </header>

        {isOwner ? <OwnerPlaceholder /> : <PublicPlaceholder userEmail={userEmail} />}
      </div>
    </main>
  );
}

function OwnerPlaceholder() {
  return (
    <>
      <section className="commonplace-card">
        <h2>Owner workspace</h2>
        <p>
          This is the authenticated owner surface. Slice 2 will add capture, and the agent layer will later let
          typing or pasting here save to the knowledge base.
        </p>
        <p>For now, authentication and route mode are wired and ready for the capture build.</p>
        <form className="commonplace-actions" action="/auth/sign-out" method="post">
          <button className="commonplace-button commonplace-button--ghost" type="submit">
            Sign out
          </button>
        </form>
      </section>
    </>
  );
}

function PublicPlaceholder({ userEmail }: { userEmail: string | null }) {
  return (
    <section className="commonplace-card">
      <h2>Portfolio agent placeholder</h2>
      <p>
        Public visitors will eventually chat with a portfolio agent here. It will use only public-safe entries from the
        commonplace knowledge base.
      </p>
      {userEmail ? (
        <>
          <p>This signed-in account is not the configured owner, so it remains in public mode.</p>
          <form className="commonplace-actions" action="/auth/sign-out" method="post">
            <button className="commonplace-button commonplace-button--ghost" type="submit">
              Sign out
            </button>
          </form>
        </>
      ) : (
        <div className="commonplace-actions">
          <Link className="commonplace-link" href="/login">
            Owner sign in
          </Link>
          <Link className="commonplace-link commonplace-link--ghost" href="/">
            Back to homepage
          </Link>
        </div>
      )}
    </section>
  );
}
