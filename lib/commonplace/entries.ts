import type { EntryInsert } from "@/lib/database.types";

export function isProbablyUrl(value: string) {
  try {
    parseUrl(value);
    return true;
  } catch {
    return false;
  }
}

export function buildEntryInsert(input: string, whySaved?: string | null): EntryInsert {
  const trimmedInput = input.trim();
  const trimmedWhySaved = whySaved?.trim() || null;

  if (isProbablyUrl(trimmedInput)) {
    const url = parseUrl(trimmedInput);

    return {
      url: url.href,
      url_normalized: normalizeUrl(url),
      why_saved: trimmedWhySaved,
      ownership: "theirs",
      content_type: "reference",
      media_type: "link",
      is_public: false,
      portfolio_featured: false,
    };
  }

  return {
    body: trimmedInput,
    why_saved: trimmedWhySaved,
    ownership: "mine",
    content_type: "thought",
    media_type: "text",
    is_public: false,
    portfolio_featured: false,
  };
}

function parseUrl(value: string) {
  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Unsupported URL protocol.");
  }

  if (!url.hostname.includes(".")) {
    throw new Error("URL must include a hostname.");
  }

  return url;
}

function normalizeUrl(url: URL) {
  const normalized = new URL(url.href);
  normalized.hash = "";

  for (const key of Array.from(normalized.searchParams.keys())) {
    const lower = key.toLowerCase();
    if (
      lower.startsWith("utm_") ||
      lower === "fbclid" ||
      lower === "gclid" ||
      lower === "mc_cid" ||
      lower === "mc_eid"
    ) {
      normalized.searchParams.delete(key);
    }
  }

  const hostname = normalized.hostname.toLowerCase().replace(/^www\./, "");
  const pathname = normalized.pathname.replace(/\/+$/, "");
  const search = normalized.searchParams.toString();

  return `${hostname}${pathname}${search ? `?${search}` : ""}`;
}
