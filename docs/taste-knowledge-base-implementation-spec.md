# Taste & Knowledge Base V1 Implementation Spec

## Purpose

This spec translates the V1 brief and research synthesis into an implementation plan for the first working version of the Taste & Knowledge Base. V1 should focus on a unified `/commonplace` surface where the authenticated owner can capture and converse, while public visitors can ask the portfolio agent about public-safe material. Viewing, editing, and search come after the unified surface is working.

## Product Scope

V1 is a single unified surface at `/commonplace`.

For the authenticated owner, the first version should allow:

- Authenticate.
- Paste or type a URL.
- Paste or type text.
- Type or paste into agent chat and have the knowledge agent save useful input to the knowledge base.
- Optionally add `why_saved`.
- Upload or paste a screenshot or work artifact.
- Save the entry quickly.
- See a simple confirmation that capture succeeded.

For public visitors, the same route should show agent chat only. The portfolio agent should answer from public-safe entries and should not expose private capture UI.

V1 does not need:

- Full browse/search.
- Editing entries.
- Review inbox for AI suggestions.
- Import/export.
- Browser extension.
- Native app.
- A separate private capture route.

## Recommended Architecture

Convert this repo into a small Next.js app and keep the existing portfolio content inside it.

### Why Next.js

The current site is mostly static, but `/commonplace` needs capabilities that GitHub Pages does not provide by itself:

- Auth-protected private pages.
- Server-side API routes.
- Secure environment variables for Supabase and AI API keys.
- File upload handling.
- Metadata extraction from URLs.
- Future AI enrichment jobs.

Next.js is a practical fit because it can serve both:

- Public portfolio pages.
- Private authenticated app pages and API routes.

### What Changes For The Existing Site

The existing portfolio would need to be moved into the Next.js app structure. Because there is not much app structure here yet, this is likely manageable.

Likely migration path:

- Move existing static assets into `public/`.
- Recreate the current homepage as `app/page.tsx` or a static page component.
- Add `/commonplace` as `app/commonplace/page.tsx`.
- Add API routes under `app/api/`.

### Hosting Recommendation

Use Vercel for the Next.js app.

GitHub Pages is fine for static hosting, but it does not run server-side routes, auth callbacks, background enrichment, or secure API logic. Vercel is the path of least resistance for a Next.js app with Supabase, uploads, and AI APIs.

Alternative later:

- Use Cloudflare Pages/Workers instead of Vercel.

For V1, one Next.js app on Vercel is simpler.

## Authentication

V1 is single-user only.

Recommended path:

- Use Supabase Auth with email magic link.
- Restrict access to an allowlisted email.
- Use authentication state to unlock owner-only `/commonplace` UI and write APIs.

Supabase Auth is the right V1 default because the app is already using Supabase for data and storage. It avoids an extra vendor, integrates naturally with Supabase row-level security, and should be faster to set up than Auth0.

Defer Auth0 unless there is a real reason to add a more complex identity provider later.

Auth rules:

- `/commonplace` is accessible to both authenticated owner and public visitors.
- Authenticated owner sees the full capture interface plus knowledge agent chat.
- Public visitors see portfolio agent chat only.
- Public portfolio pages remain unauthenticated.
- API routes that create entries require authentication.
- The public portfolio agent must not use the private authenticated retrieval path.

## Database

Use Supabase Postgres for V1.

The Supabase database/project name is `commonplace`.

Supabase will store:

- Entries.
- Highlights.
- Tags.
- Relations.
- Source metadata.
- AI-generated metadata.

### pgvector

`pgvector` is a Postgres extension that stores embeddings, which are numeric representations of text used for semantic search.

It allows future queries like:

- "Find things related to tactile interfaces."
- "What references explain my taste in quiet design?"
- "Find similar entries to this project."

Embeddings are useful for the later agent layer, but V1 capture can work before semantic search is fully implemented.

## Storage

Use Supabase Storage for V1 uploads.

Reasoning:

- The database is already Supabase.
- Supabase Storage is simpler to set up than adding Cloudflare R2 immediately.
- V1 uploads are limited to screenshots and the user's own work artifacts, so storage volume should stay modest.

Defer Cloudflare R2 until:

- Upload volume grows.
- Rich media archiving becomes important.
- Storage cost or portability becomes a real issue.

Storage rules:

- Store URLs and text by default.
- Do not archive rich media by default.
- Allow uploads mainly for screenshots, pasted images, and work artifacts that are not reliably hosted elsewhere.
- In Slice 2, ship URL/text capture first, then add screenshot and file uploads as the next part of the same slice.

## AI Provider

Use inexpensive AI defaults and keep providers swappable.

Recommended V1 defaults:

- OpenAI `text-embedding-3-small` for embeddings when semantic retrieval is added.
- A low-cost OpenAI text model for summaries and metadata extraction.

AI should not block capture. The save should complete first; enrichment should run after save in a fire-and-forget flow. At V1 scale, this does not need a durable queue.

AI-generated data should be labeled rather than creating a review inbox.

Examples:

- AI-created summary is stored with `summary_created_by = ai`.
- AI-suggested tags are visibly marked as AI-suggested.
- The user can accept, edit, replace, or remove an AI tag when they encounter it in context.

## V1 Capture Flow

### Mobile Experience

The `/commonplace` page must be designed for phone use from the start. V1 does not need a native app or true iOS Share Sheet integration, but the web page should be fast and comfortable on mobile Safari.

Mobile requirements:

- Large input targets.
- Minimal fields above the fold.
- Easy paste of URLs or text.
- Optional `why_saved` that does not block save.
- File input support for screenshots or photos when uploads are added.
- Clear saved confirmation.

Later mobile helpers can include an iOS Shortcut that sends URLs, text, images, or files to the capture endpoint.

### Basic Flow

1. User opens `/commonplace`.
2. User authenticates if needed.
3. If authenticated as the owner, the user sees capture controls plus knowledge agent chat.
4. Owner enters a URL, text, pasted content, chat message, or uploaded file.
5. Owner optionally adds `why_saved`.
6. App creates an entry with inferred defaults.
7. App shows a quick saved confirmation.
8. The knowledge agent handles chat input and can save useful typed or pasted material.
9. AI enrichment can run afterward.

For a public visitor, `/commonplace` shows portfolio agent chat only. The portfolio agent handles input and retrieves only from public-safe entries.

### Required Fields

No metadata fields should be required.

The practical minimum payload is one of:

- URL
- body/text
- selected text/highlight
- uploaded file
- pasted screenshot

The UI should not require:

- title
- content type
- ownership
- media type
- tags
- discipline
- `why_saved`
- public/private choice

### Inferred Defaults

- URL save: `ownership = theirs`, `content_type = reference`, `media_type = link`.
- Text-only save: `ownership = mine`, `content_type = thought`, `media_type = text`.
- Upload save: infer `media_type` from the file type.
- `is_public = false`.
- `portfolio_featured = false`.

### Discipline

`discipline` is a free-text field, not an enum and not a tag in V1.

It should be used as a lightweight top-level filter for broad domains such as `architecture`, `product design`, `music`, `film`, `writing`, or `fashion`. The UI should provide typeahead from existing values to avoid drift, but users should be able to enter a new discipline without schema changes.

Tags remain the more flexible layer for qualities, subjects, projects, and context.

## Data Model

### `entries`

Core fields:

- `id uuid primary key`
- `created_at timestamptz`
- `updated_at timestamptz`
- `title text`
- `body text`
- `why_saved text`
- `summary text`
- `summary_created_by enum(user, ai)`
- `url text`
- `url_normalized text`
- `canonical_url text`
- `source_platform text`
- `source_id text`
- `saved_version text`
- `media_storage_url text`
- `media_type enum(image, video, audio, document, link, text)`
- `content_type enum(work, writing, thought, reference, principle)`
- `ownership enum(mine, theirs)`
- `discipline text`
- `creator text`
- `source text`
- `is_public boolean default false`
- `portfolio_featured boolean default false`
- `embedding vector(1536)`

### `highlights`

- `id uuid primary key`
- `entry_id uuid references entries(id)`
- `body text`
- `note text`
- `timestamp text`
- `page int`
- `locator jsonb`
- `created_at timestamptz`
- `embedding vector(1536)`

### `tags`

- `id uuid primary key`
- `name text unique`
- `created_by enum(user, ai)`
- `created_at timestamptz`

### `entry_tags`

- `id uuid primary key`
- `entry_id uuid references entries(id)`
- `tag_id uuid references tags(id)`
- `created_by enum(user, ai)`
- `status enum(accepted, pending, rejected)`

For V1, avoid a separate review inbox. AI tags can appear in context with an AI label and controls to accept, edit, replace, or remove.

### `relations`

- `id uuid primary key`
- `from_entry_id uuid references entries(id)`
- `to_entry_id uuid references entries(id)`
- `relation_type enum(inspired_by, used_in, contrasts_with, related)`
- `note text`
- `created_by enum(user, ai)`
- `status enum(accepted, pending, rejected)`
- `created_at timestamptz`

Relations are not needed for the first capture-only slice, but the schema can include them.

## API Routes

Initial routes:

- `POST /api/entries`: create an entry from URL, text, optional `why_saved`, and optional file metadata.
- `POST /api/uploads`: upload screenshot or work artifact to Supabase Storage.
- `POST /api/enrich`: trigger enrichment for one entry after save. In V1 this can be called in a fire-and-forget client flow or triggered immediately by the server after entry creation; it does not need a queue.
- `POST /api/chat`: auth-aware agent chat. Authenticated owner requests use the knowledge agent and may save typed or pasted input. Public requests use the portfolio agent and public-safe retrieval only.

Later routes:

- `GET /api/entries`: list recent entries.
- `PATCH /api/entries/:id`: edit entry fields.
- `POST /api/highlights`: add highlights.
- `POST /api/tags`: create or update tags.
- `POST /api/search`: search entries.

## AI Enrichment

V1 enrichment tasks:

- Generate `summary`.
- Infer `title` from URL metadata or pasted text.
- Normalize URL.
- Infer `canonical_url`, `source_platform`, and `source_id`.
- Suggest tags and qualities.
- Suggest `discipline`.
- Generate image alt text or OCR later for screenshots.

AI should not:

- Set `is_public = true`.
- Edit `why_saved`.
- Delete entries.
- Merge entries.
- Directly publish content.
- Create a review inbox the user has to manage.

## Public And Private Boundary

V1:

- Store `is_public` at the entry level.
- Default `is_public` to `false`.
- Private authenticated user can access all entries.
- Public portfolio features should only read public-safe material.

Later:

- Add chunk-level permissions if public entries contain mixed private/public material.
- Add a public-safe vector index before broadening portfolio agent retrieval.

Important future consideration:

- `why_saved` may be too private to expose publicly even when the entry itself is public.

## Implementation Slices

### Slice 1: App Foundation

- Convert repo to Next.js.
- Preserve current public homepage as-is.
- Deploy to Vercel.
- Add environment variable structure.
- Add Supabase Auth with email magic link.
- Add `/commonplace` as the unified route.
- Protect owner-only UI and write APIs by authentication state.

### Slice 2: Capture

- Build `/commonplace` with authenticated owner capture controls.
- Make `/commonplace` mobile-responsive from the start.
- Add input for URL/text first.
- Add optional `why_saved`.
- Save entries to Supabase.
- Show saved confirmation.
- Add file upload or pasted screenshot support after URL/text capture works.

### Slice 3: Enrichment

- Add URL metadata extraction.
- Add AI-generated summary.
- Add AI-suggested tags with visible AI label.
- Add basic URL normalization and deduplication.
- Run enrichment after save without blocking the capture confirmation.

### Slice 4: View And Edit

- List recent entries.
- Open entry detail.
- Edit title, body, why_saved, tags, discipline, and public/private state.
- Remove or replace AI-suggested tags in context.

### Slice 5: Retrieval And Agent

- Add full-text search.
- Add embeddings and semantic search.
- Add knowledge agent chat over all entries and highlights for the authenticated owner.
- Add portfolio agent chat over public-safe entries for public visitors.

## Decisions Before Coding

- Migrate the current static homepage as-is; redesign is out of scope.
- Use Supabase Auth with email magic link; do not start with Auth0.
- Include uploads in Slice 2, but ship URL/text capture first and add uploads after.
- Run enrichment after save in a fire-and-forget flow; no queue at V1 scale.
- Use `commonplace` as the Supabase database/project name.
- Use `/commonplace` as a single auth-aware surface; do not add a separate private capture route.
