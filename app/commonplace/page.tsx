import Link from "next/link";

import { CaptureForm } from "@/app/commonplace/capture-form";
import type { Entry } from "@/lib/database.types";
import { getOwnerEmail, hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

async function getCommonplaceState() {
  if (!hasSupabaseConfig()) {
    return {
      userEmail: null,
      recentEntries: [],
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email?.toLowerCase() ?? null;
  let recentEntries: Entry[] = [];

  if (userEmail && userEmail === getOwnerEmail()?.toLowerCase()) {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    recentEntries = data ?? [];
  }

  return {
    userEmail,
    recentEntries,
  };
}

export default async function CommonplacePage() {
  const { userEmail, recentEntries } = await getCommonplaceState();
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

        {isOwner ? <OwnerWorkspace recentEntries={recentEntries} /> : <PublicPlaceholder userEmail={userEmail} />}
      </div>
    </main>
  );
}

function OwnerWorkspace({ recentEntries }: { recentEntries: Entry[] }) {
  return (
    <>
      <section className="commonplace-card">
        <h2>Capture</h2>
        <p>
          Save a link or thought quickly. The app infers whether it is a reference link or a text note and keeps it
          private by default.
        </p>
        <CaptureForm />
      </section>

      <section className="commonplace-card">
        <h2>Recent captures</h2>
        {recentEntries.length > 0 ? (
          <ol className="commonplace-entry-list">
            {recentEntries.map((entry) => (
              <li className="commonplace-entry" key={entry.id}>
                <p className="commonplace-entry__meta">
                  {entry.content_type} · {entry.media_type} · {formatDate(entry.created_at)}
                </p>
                <h3>{getEntryTitle(entry)}</h3>
                {entry.url ? (
                  <a href={entry.url} target="_blank" rel="noreferrer">
                    {entry.url}
                  </a>
                ) : null}
                {entry.body ? <p>{entry.body}</p> : null}
                {entry.why_saved ? <p className="commonplace-entry__why">Why saved: {entry.why_saved}</p> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p>No captures yet. Save a link or thought to start the collection.</p>
        )}
        <form className="commonplace-actions" action="/auth/sign-out" method="post">
          <button className="commonplace-button commonplace-button--ghost" type="submit">
            Sign out
          </button>
        </form>
      </section>
    </>
  );
}

function getEntryTitle(entry: Entry) {
  if (entry.title) {
    return entry.title;
  }

  if (entry.url) {
    try {
      return new URL(entry.url).hostname.replace(/^www\./, "");
    } catch {
      return entry.url;
    }
  }

  return entry.body?.slice(0, 80) ?? "Untitled entry";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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
