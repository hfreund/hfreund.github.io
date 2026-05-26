# Taste & Knowledge Base Research Synthesis

## Purpose

This synthesis preserves the research takeaways that should guide V1 of the Taste & Knowledge Base. It combines patterns from capture tools, visual curation systems, personal knowledge bases, and agent retrieval systems, then translates them into decisions for this project.

## Core Direction

Build a private-first, low-friction capture and recall system for curated taste and knowledge. The system should start as a personal tool, become useful as private agent context, and later power a public portfolio agent through explicit public/private boundaries.

The product should optimize for capturing the moment of recognition: a reference, highlight, song, screenshot, Figma link, website, idea, quote, or opinion. Organization, enrichment, and public exposure should happen after capture.

## Research Themes

### Fast Capture Beats Complete Metadata

Comparable tools consistently protect capture speed. Are.na, Raindrop, Readwise Reader, mymind, Fabric, Cosmos, and Sublime all point toward the same behavior: save first, organize later.

Implications for V1:

- Use a single web capture page as the primary interface.
- Do not require title, tags, content type, ownership, discipline, or `why_saved` to save.
- Allow save from URL, pasted text, selected text, pasted screenshot, or uploaded file.
- Let AI enrich metadata after save instead of blocking capture.
- Maintain an inbox-like default state for entries that still need review.

### Web-First Capture Solves the Hardest Device Constraint

The user's work laptop is the most restrictive environment because it cannot rely on installed software. A private authenticated page on the portfolio site works across iPhone, personal laptop, and work laptop.

V1 decision:

- Carry forward a private web capture surface at `/brain`.
- Defer browser extensions and native apps.
- Consider bookmarklets and iOS Shortcut support later as lightweight helpers, not V1 requirements.

Useful future capture helpers:

- iOS Shortcut for Share Sheet capture, since iOS Safari does not reliably support a PWA as a share target.
- Desktop bookmarklet that sends page URL, title, and selected text to `/brain`.
- Clipboard paste for screenshots and selected text.

### Taste Is Mostly In The User's Read

The source object alone does not explain taste. The most important durable field is the user's specific reason for caring.

V1 decision:

- Keep `why_saved` optional but prominent.
- Treat `why_saved` as more important than generic summary or metadata.
- Let AI generate summaries, but do not let AI replace the user's read.

### Tags Should Start Lightweight

Visual and taste tools use flexible cross-cutting labels rather than rigid taxonomies. Aesthetic taste is associative and contextual, so overly formal hierarchies will likely age badly.

V1 decision:

- Do not seed the full proposed tag vocabulary into the database.
- Let tags and qualities emerge from user behavior and AI suggestions.
- AI-suggested tags should start as pending and require user acceptance.
- Keep the larger vocabulary list in the V1 brief as inspiration/review material only.

Recommended tag patterns:

- Qualities: `quiet`, `tactile`, `editorial`, `warm`, `precise`, `cinematic`, `restrained`, `playful`.
- Subjects: `typography`, `interaction`, `architecture`, `music`, `film`, `product`, `portfolio`.
- Contexts: project names, case studies, moods, active explorations, and current obsessions.

### Visual Recall Matters

Designers often remember by feel before they remember by words. Research across moodboarding and reference tools suggests browsing should not be only a text list.

Implications for V1 and later:

- Start with simple list/search if needed, but plan for a visual grid or gallery.
- Screenshots are valuable because they preserve visual context when a source URL is weak, private, or transient.
- OCR and AI-generated descriptions can make screenshots searchable later.
- Boards or collections can wait until there is real usage pressure.

### Agents Need Permissioned Retrieval, Not Prompt-Only Rules

Agent access should be enforced by retrieval boundaries, not just by telling the agent not to reveal private material.

V1 decision:

- Carry forward entry-level `is_public`, default `false`.
- Private assistant can read all entries.
- Public portfolio agent can read only public-safe material.
- Public retrieval should be limited to safe public fields.

Deferred:

- Separate public vector index or materialized public retrieval view.
- Chunk-level visibility controls.

Design for later:

- Retrieval should be structured so chunk-level permissions can be added later.
- Before public launch, consider a separate public retrieval surface rather than querying the full private index and filtering afterward.

## Carry Forward Decisions

- Primary V1 capture interface: private authenticated web page.
- Route name: `/brain`.
- Required capture metadata: none.
- Practical minimum captured payload: URL, body/text, selected text, pasted highlight, or uploaded file.
- Storage: URLs and text by default; uploads mainly for screenshots and the user's own work artifacts.
- AI writes: allow creation of new entries/highlights from user-provided input, plus summaries and source metadata.
- AI suggestions: tags, qualities, and relations should be reviewable before becoming accepted taxonomy.
- Public/private: entry-level `is_public`, default `false`; public access should use safe public fields.
- Tags: do not seed the full vocabulary; let AI and usage suggest tags organically.

## Defer For Later

- Browser extension.
- Native app.
- Required boards, collections, or graph organization.
- Stance/sentiment field.
- Publishing status.
- Full media archiving.
- Separate public vector index.
- Chunk-level permissions.
- Direct agent edits to accepted tags, relations, `why_saved`, or public/private state.

## Implementation Implications

### Capture Page

The `/brain` page should have a large, forgiving input that accepts:

- URL
- Plain text
- Selected text or quote
- Optional `why_saved`
- Pasted screenshot
- Uploaded file

After save, the page can offer secondary actions:

- Add `why_saved`
- Add tags
- Mark public
- Attach to a project
- Review AI suggestions

### Data Model

The existing V1 brief remains directionally correct. Important fields for retrieval include:

- `title`
- `body`
- `why_saved`
- `summary`
- `discipline`
- `creator`
- `source`
- `source_platform`
- `url`
- `canonical_url`
- `tags`
- `highlights`
- `relations`
- `is_public`

### Retrieval

Use hybrid retrieval when implementation reaches agent context:

- Metadata filters first.
- Full-text search for exact matches.
- Vector search for semantic recall.
- Accepted tags and relations for expansion.

Before public agent launch, revisit:

- Public-safe fields.
- Whether `why_saved` can ever be public.
- Separate public retrieval index or view.
- Citations and refusal behavior when retrieval confidence is low.

## Open Implementation Questions

- What framework should power `/brain` within or alongside this portfolio site?
- What authentication method should protect private capture?
- Should Supabase be the first storage layer?
- What should the first search/browse UI look like: list, cards, grid, or mixed?
- How much AI enrichment should happen synchronously after save versus in a background queue?
