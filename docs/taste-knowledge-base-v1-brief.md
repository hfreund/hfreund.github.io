# Taste & Knowledge Base V1 Brief

## Purpose

Create a central place to collect curated taste and knowledge across references, projects, writing, thoughts, ideas, media, and design opinions. The first goal is personal recall. The second is giving an agent useful context about what Hugh likes, notices, values, and thinks. The third is powering a future portfolio site where visitors can ask an agent about Hugh, his work, his design perspective, and the references behind it.

The system should avoid becoming a heavy personal knowledge graph too early. Saving something should be fast enough to preserve the user's flow of thought, with richer structure added later by the user or with AI assistance.

## V1 Goals

- Capture references, original work, writing, thoughts, principles, and highlights in one system.
- Make the minimum save flow very fast: a URL or body should be enough to create an entry.
- Preserve the user's specific reason for saving something through a prominent optional `why_saved` field.
- Support lightweight search and retrieval through metadata, tags, full text, highlights, and embeddings.
- Let AI enrich entries after capture with summaries, tags, qualities, relations, and metadata suggestions.
- Keep public portfolio exposure explicit through `is_public`, which defaults to `false`.

## Non-Goals

- Do not require a complete metadata form for every capture.
- Do not model publishing workflows for writing in V1.
- Do not add stance, sentiment, revision history, or complex visibility states in V1.
- Do not require separate systems for taste, knowledge, portfolio content, and agent memory.
- Do not overfit the schema to one medium such as articles or bookmarks.

## Primary Use Cases

### Personal Recall

The user can quickly save things they encounter, add a short note about why it matters, and later search by title, source, tag, discipline, creator, URL, highlight, or semantic similarity.

### Agent Context

An agent can retrieve relevant entries and highlights to understand the user's taste, references, projects, writing, and design principles. The agent should especially use `why_saved`, tags, qualities, and highlights to infer how the user thinks rather than only what they collected.

### Portfolio Agent

A future portfolio site can expose public entries and published work to visitors through an agent. Public access should be controlled by `is_public = true`; private material remains available only to the user and private agents.

## Content Model

The system centers on a single `entries` table. Everything saved is an entry: a reference, a project, a thought, a principle, a piece of writing, a document, an image, a video, a song, or a link.

Supporting tables provide highlights, tags, entry-tag review state, and relations between entries.

## Core Entry Fields

### Required or Auto-Generated

- `id`: UUID primary key.
- `created_at`: auto-set timestamp.
- `updated_at`: auto-updated timestamp.
- `media_type`: `image`, `video`, `audio`, `document`, `link`, or `text`.
- `content_type`: `work`, `writing`, `thought`, `reference`, or `principle`.
- `ownership`: `mine` or `theirs`.
- `is_public`: boolean, default `false`.

### Optional User-Facing Fields

- `title`: optional title, inferred from URL metadata when possible.
- `body`: main note, text, description, or draft content.
- `why_saved`: the user's specific read on why this resonated or mattered.
- `summary`: short summary, AI-generated and user-editable.
- `summary_created_by`: `user` or `ai`.
- `discipline`: free-text domain such as design, architecture, film, music, product, art, fashion, writing, or technology. The UI should use typeahead from existing values.
- `creator`: person, studio, brand, author, artist, or organization behind the thing.
- `source`: where the user found it.
- `portfolio_featured`: boolean for highlighting public work or references later.

### Source and Storage Fields

- `url`: original source URL.
- `url_normalized`: normalized URL for deduplication.
- `canonical_url`: canonical source URL when available.
- `source_platform`: platform or service, such as YouTube, Instagram, Spotify, Are.na, Substack, or GitHub.
- `source_id`: platform-native identifier when available.
- `saved_version`: plain-text snapshot of source content at save time.
- `media_storage_url`: optional pointer to richer media stored outside Postgres.
- `embedding`: vector embedding of the entry text used for semantic retrieval.

## Highlights

Highlights capture granular moments inside a source, such as a quote, passage, video timestamp, podcast moment, or page-level note.

Fields:

- `id`
- `entry_id`
- `body`
- `note`
- `timestamp`
- `page`
- `locator jsonb`
- `created_at`
- `embedding`

`locator` should be flexible enough to represent timestamps, pages, chapters, selectors, image regions, or other future source-location formats.

## Tags and Qualities

Tags are reusable labels shared across entries. In V1, aesthetic qualities should use the same tag system rather than a separate model.

Seed quality tags to review:

- `quiet`
- `tactile`
- `editorial`
- `warm`
- `precise`
- `cinematic`
- `restrained`
- `playful`
- `monolithic`
- `humane`
- `minimal`
- `maximal`
- `ornate`
- `spare`
- `soft`
- `hard`
- `raw`
- `polished`
- `imperfect`
- `handmade`
- `industrial`
- `organic`
- `architectural`
- `sculptural`
- `atmospheric`
- `immersive`
- `intimate`
- `expansive`
- `nostalgic`
- `futuristic`
- `timeless`
- `strange`
- `surreal`
- `dreamlike`
- `severe`
- `elegant`
- `functional`
- `expressive`
- `graphic`
- `typographic`
- `textural`
- `layered`
- `modular`
- `systematic`
- `humanist`
- `technical`
- `calm`
- `energetic`
- `moody`
- `witty`
- `earnest`
- `luxurious`
- `utilitarian`
- `high-contrast`
- `muted`
- `saturated`
- `monochrome`
- `colorful`

Seed subject and discipline tags to review:

- `design`
- `product-design`
- `interaction-design`
- `visual-design`
- `graphic-design`
- `typography`
- `branding`
- `web-design`
- `software`
- `tools`
- `ai`
- `architecture`
- `interiors`
- `furniture`
- `industrial-design`
- `fashion`
- `film`
- `music`
- `photography`
- `art`
- `writing`
- `strategy`
- `process`
- `portfolio`
- `case-study`
- `reference`
- `principle`
- `quote`

AI-suggested tags should start as `pending`; the user can accept or reject them. Rejected suggestions should be stored on the entry so the AI does not keep suggesting the same bad tag.

## Relations

Relations connect entries explicitly, for example when a reference inspired a project or when two entries contrast with each other.

V1 relation types:

- `inspired_by`
- `used_in`
- `contrasts_with`
- `related`

Relations may be user-created or AI-suggested and should follow the same `pending`, `accepted`, `rejected` workflow as tags.

Add an optional `note` field for cases where the reason for the connection matters. This should never be required during capture.

## Capture Defaults

The UI should infer defaults to reduce friction:

- Saving a URL defaults to `ownership = theirs`, `content_type = reference`, and `media_type = link`.
- Saving text without a URL defaults to `ownership = mine`, `content_type = thought`, and `media_type = text`.
- Uploading media infers `media_type` from the file type.
- `is_public` always defaults to `false`.
- `why_saved`, tags, discipline, creator, source, summary, and relations are optional.

## Capture Surfaces

The first interface should work anywhere the user can open a website. A simple authenticated upload/capture page on the portfolio domain is the best V1 target because it works from an iPhone, personal laptop, and restrictive work laptop without requiring installed software.

Possible routes:

- `/brain`
- `/taste`
- `/graph`

The page should support:

- URL paste for articles, websites, Instagram posts, Spotify links, podcasts, videos, Figma links, and other hosted references.
- Text capture for quick thoughts, observations, and principles.
- Optional `why_saved` at capture time.
- File upload for screenshots and work artifacts that are not reliably hosted elsewhere.
- Later enrichment by AI so capture remains quick.

V1 should store URLs and text first. Large media should not be copied by default. Screenshots and work artifacts are the strongest early case for storing uploaded media because they may not exist at a stable public URL.

## AI Assistance

AI should support capture without making capture slower.

Useful V1 AI tasks:

- Generate or update `summary`.
- Suggest tags and aesthetic qualities.
- Infer media type, source platform, creator, source ID, and canonical URL.
- Suggest discipline from existing values.
- Suggest related entries.
- Extract highlights from saved text.
- Improve search queries and retrieve relevant entries for agent answers.

AI suggestions should be reviewable when they affect durable taxonomy or relationships, especially tags and relations.

## Deduplication

On save:

1. Normalize the URL by stripping protocol, `www`, trailing slashes, tracking params, and hash fragments.
2. Check `url_normalized` for exact matches.
3. If a match exists, surface the existing entry and attach any new highlight or note.
4. If no exact URL match exists, use canonical URL, source platform/source ID, and title similarity to flag possible duplicates.
5. If no match is found, create a new entry.

Duplicates are acceptable in V1 as long as search and manual merge remain possible.

## Public Portfolio Boundary

The portfolio agent should only use entries where `is_public = true`. For the user's own work, the portfolio can additionally filter or prioritize `ownership = mine` and `portfolio_featured = true`.

There is no V1 publishing status. Writing and public site publication can continue to be managed through GitHub and the portfolio codebase.

## First Agent Permissions

The open question "what should the first agent be allowed to read and write?" means defining the agent's permissions against the knowledge base.

For V1, the safest split is:

- Private assistant: can read all entries, highlights, tags, and relations.
- Public portfolio agent: can read only entries where `is_public = true`.
- Any agent: can suggest summaries, tags, qualities, highlights, and relations.
- Any agent: should not silently publish entries, change `is_public`, delete content, or permanently accept taxonomy changes without user confirmation.

The first write-capable agent should probably create draft enrichment suggestions rather than directly editing trusted fields.

## Research Questions

- Which comparable tools should influence capture, browsing, and recall patterns?
- What capture patterns work best across iPhone, personal laptop, and restrictive work laptop?
- What vocabulary and browsing patterns best support design taste recall?
- How should AI suggestions be reviewed without slowing down capture?
- What should the first authenticated web capture page be called?
