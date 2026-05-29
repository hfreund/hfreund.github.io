"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function CaptureForm() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [whySaved, setWhySaved] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);

    const response = await fetch("/api/entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        why_saved: whySaved,
      }),
    });

    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus("error");
      setMessage(result.error ?? "Could not save this entry.");
      return;
    }

    setInput("");
    setWhySaved("");
    setStatus("saved");
    setMessage("Saved to commonplace.");
    router.refresh();
  }

  return (
    <form className="commonplace-capture" onSubmit={handleSubmit}>
      <label className="commonplace-label">
        URL or thought
        <textarea
          className="commonplace-input commonplace-textarea"
          name="input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste a link, quote, note, or thought..."
          required
          rows={5}
        />
      </label>
      <label className="commonplace-label">
        Why saved
        <textarea
          className="commonplace-input commonplace-textarea commonplace-textarea--small"
          name="why_saved"
          value={whySaved}
          onChange={(event) => setWhySaved(event.target.value)}
          placeholder="Optional: what made this resonate?"
          rows={3}
        />
      </label>
      <div className="commonplace-actions">
        <button className="commonplace-button" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : "Save"}
        </button>
        {message ? (
          <p className={`commonplace-form-status commonplace-form-status--${status}`} role="status">
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
