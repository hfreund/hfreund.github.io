import Link from "next/link";

import { signInWithMagicLink } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    sent?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const error = params.error;
  const errorMessage = getErrorMessage(error);

  return (
    <main className="commonplace-page">
      <div className="commonplace-shell">
        <header className="commonplace-header">
          <div>
            <p className="commonplace-eyebrow">Commonplace</p>
            <h1 className="commonplace-title">Sign in</h1>
          </div>
          <p className="commonplace-session">Magic link</p>
        </header>

        <section className="commonplace-card">
          <h2>Owner access</h2>
          <p>Enter the owner email address to receive a Supabase magic link.</p>
          {sent ? <p>Check your inbox for the sign-in link.</p> : null}
          {errorMessage ? <p>Unable to send link: {errorMessage}</p> : null}

          <form className="commonplace-form" action={signInWithMagicLink}>
            <label className="commonplace-label">
              Email
              <input className="commonplace-input" type="email" name="email" autoComplete="email" required />
            </label>
            <div className="commonplace-actions">
              <button className="commonplace-button" type="submit">
                Send magic link
              </button>
              <Link className="commonplace-link commonplace-link--ghost" href="/commonplace">
                Back to commonplace
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function getErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "missing-email") {
    return "Enter an email address.";
  }

  if (error === "missing-supabase-config") {
    return "Supabase environment variables are missing. Add them to .env.local and restart the dev server.";
  }

  return decodeURIComponent(error);
}
