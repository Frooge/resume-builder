# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Client-only React 19 + Vite + Tailwind v4 + Zustand app: edit a resume on the left, see a paginated A4 preview on the right, export PDF / DOCX / JSON. No backend.

## Verifying changes

There is no test suite. A change is verified when `npm run lint` (oxlint) and `npm run build` (`tsc -b && vite build`) both pass; for rendering changes, also run `npm run dev` and check the preview plus each affected export.

Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`). `vite.config.ts` sets `base: '/resume-builder/'`, so asset paths must stay base-relative.

## Three renderers, one resume

The same `ResumeData` is drawn by three independent renderers that must stay visually in sync:

- `src/components/preview/ResumeDocument.tsx`: HTML preview. Splits the resume into flow units, renders them in a hidden measuring container, then packs them into fixed A4 pages (`src/lib/pageSize.ts`, 794×1123 px at 96 dpi, with `PAGE_PACK_BUFFER_PX` slack).
- `src/lib/exportPdf.ts`: draws text natively with jsPDF (not a screenshot of the preview), using only the standard `times`/`helvetica` fonts so files stay small and text stays selectable. Those fonts only cover WinAnsi, and one character outside it garbles the whole line, so all text goes through `toWinAnsi` (`src/lib/pdfText.ts`) inside `wrap`/`writeLines`; draw new text through those helpers. Its own cursor/`ensureSpace` logic handles page breaks.
- `src/lib/exportDocx.ts`: builds a Word document with `docx`.

A layout or content change to any section means editing all three. The contact line's items, display text and link targets come from `contactLinks` (`src/lib/contactLinks.ts`), which only emits `http(s)`/`mailto:` hrefs; the PDF draws that line segment by segment so each link gets its own clickable area. Shared inputs keep them aligned: `src/lib/typography.ts` (font mapping per target; px sizes for preview/PDF, separate half-point sizes for DOCX), `src/lib/sortEntries.ts`, `src/lib/formatDate.ts`, and `SECTION_LABELS`. Each renderer converts from the CSS-px source of truth: PDF to mm, DOCX to twips (`pxToTwip`) and half-points.

Experience and education are sorted at render time (current first, then newest dates); their stored array order is not display order. ## Section order

All ordering rules live in `src/lib/sectionOrder.ts`. Contact and Summary are pinned first (`PINNED_SECTIONS`); `parseSectionOrder` enforces this on imported and persisted data, and every reorder goes through the store's `moveSection`, which treats a drop onto a pinned section as "first movable slot". The editor renders its accordions in `resume.sectionOrder`, and both the editor and the preview can be dragged to reorder (separate `DndContext`s sharing sensors and pointer-based collision detection from `src/components/sectionDnd.ts`).

Sections listed in `resume.hiddenSections` (toggled from the editor's accordion headers) are skipped by every renderer but kept in the data and the JSON export, and stay draggable in the editor. Renderers get their section list from `visibleSectionOrder` rather than reading `sectionOrder` directly.

## State and persistence

`src/store/resumeStore.ts` is the single store. It persists `resume`, `style`, `savedResumes` and `activeSavedId` to localStorage under the key `resume-builder`; `ui` is session-only. The persist `merge` runs every stored resume through `parseResumeData` and every style through `normalizeResumeStyle`, so older payloads missing newer fields still load.

Preview → editor navigation goes through the store: clicking edit on a preview section calls `requestFocusSection`, and `EditorPanel` reacts to `ui.focusSectionRequest` by opening and scrolling to that section.

## Adding a field

A new resume or style field touches, in order: `src/types/resume.ts`; `src/lib/sampleResume.ts` (both `sampleResume` and `createEmptyResume`); the store actions; `parseResumeData` in `src/lib/resumeFile.ts` (validates field by field and defaults anything missing, for both JSON imports and persisted localStorage); the editor section under `src/components/editor/sections/`; and all three renderers. A new style field also needs a default in `DEFAULT_RESUME_STYLE` and handling in `normalizeResumeStyle` so persisted data migrates.

## Import / export file format

JSON exports are `{ kind: 'resume-builder', version: 1, name, exportedAt, resume, style }` (`src/lib/resumeFile.ts`). Changing the shape incompatibly means bumping `RESUME_FILE_VERSION` and keeping a parser for the old version. Import sources register in `src/lib/import/index.ts` as `ResumeImporter`s; the toolbar builds its import menu from that list.
