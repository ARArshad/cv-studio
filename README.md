# CV Studio

Build a professional CV and matching cover letter by typing straight onto the page, with
fifty-six templates in eleven categories (all free), document tags, and clean PDF/text exports.
Free, private (CVs stay in the browser) and no sign up.

![The editor](docs/editor.png)

## What it does

- **Landing page and template gallery** at `/` and `/templates`.
- **My documents dashboard** at `/dashboard`: CVs and cover letters with live thumbnails. Create (from a worked
  example or a blank page, in any template), open, rename, duplicate, download a copy, delete,
  and import a saved copy.
- **Editor** at `/editor?id=<id>`, where you **type straight onto the CV**:
  - Click any text on the page to edit it. `Enter` in a bullet starts the next one (splitting
    at the caret), `Backspace` on an empty bullet removes it, `Cmd B`, `Cmd I` and `Cmd U` format
    bullets and summaries, pasting keeps plain text.
  - Hover a section heading for its toolbar: add an entry or item, move up or down, move between
    sidebar and main column, hide, delete. Hover an entry for its own: add below, add a bullet,
    move, choose which parts show (organisation, location, dates, description, bullets,
    "I am still here"), delete. Click skill dots, bars or rings to set a level. Click the photo
    to change it.
  - **Top toolbar**: undo and redo, **Layout** (one column or a sidebar on either side, sidebar
    width, six section arrangements, photo, job title, summary in the header, contact and heading
    icons, page numbers and your name on later pages, photo shape), **Fonts** (19 fonts for
    headings and body, size, line, word and letter spacing), **Themes** (16 two colour themes,
    custom colours, six page backgrounds), **Preferences** (country and experience level, A4 or
    Letter, spacing, margins, date format, six skill level styles), and **Download** (PDF, a .json
    copy, duplicate). A balancer under the page moves the split between the two columns.
  - Dates open a month and year picker (or take free text such as "Summer 2019"), and the Page
    panel changes how every date is written. Clicking the photo opens a crop tool: drag to frame,
    zoom, rotate.
  - **Tool card**: **ATS checker** (paste a job advert to see which of its key words your CV
    already uses), **Import content** (upload an old CV as a PDF or paste its text and it is
    sorted into sections), **Templates** (all fifty-six drawn with your own CV, filtered by
    category), **Saved content** (keep your best bullets and entries and reuse them in any CV),
    **Optimizer** (a CV score plus line by line suggestions, also shown as markers in the margin
    of the page, with one click fixes for weak openings and personal details that do not belong),
    **Add section** (22 section types), **Rearrange** (drag to reorder, move between columns,
    hide and show), **Personal info** (photo and contact details) and **Phrases** (ready made
    bullets dropped into the job you were editing).
  - New CVs start from a worked example for the role (marketing, software and IT, student,
    executive, design, healthcare) or a blank skeleton with placeholders in every field.
  - Real pages: long CVs flow onto further pages, a job's later bullets carry over rather than
    leaving a gap, and a heading never sits alone at the bottom of a page.

## Templates

Fifty-six templates, every one free, in eleven categories: Simple, Modern, Professional, Executive,
Creative, Minimalist, Traditional, Skill-based, Hybrid, Student, and IT and tech. The twenty-five
marked premium are the kind of design other builders charge for. All of them are original
designs; none copies another builder's templates.

| Premium | | |
|---|---|---|
| **Pulse** curved dark header, icon headings | **Cascade** wave header with photo | **Monarch** monogram crest, serif, double rules |
| **Horizon** full height photo panel, timeline | **Mosaic** sections on soft cards | **Nordic** stone sidebar, initial watermark |
| **Apex** black header, accent stripe | **Bloom** soft circles, tinted sidebar | **Sterling** navy executive, icons, timeline |
| **Orbit** dark tech sidebar, skill rings | **Zenith** summary in the header, pill headings | **Fusion** hybrid, skills band first |
| **Catalyst** skill based, strengths first | **Terminal** monospace, code style header | **Elegance** split header, gold accent |
| **Canvas** colour stripe, gradient header | **Aurum** black and gold executive panel | **Ember** warm gradient header, chunky tabs |
| **Glacier** pale ice, thin type | **Halo** big photo halo, pastel panel | **Ivory** warm cream, classic serif |
| **Meadow** fresh green cards | **Onyx** black header, neon line | **Quartz** faceted corner, balanced columns |
| **Ribbon** bookmark titles, skills first | **Solstice** sunrise arc, sand sidebar | |

| Free | | |
|---|---|---|
| **Aurora** colour sidebar with photo | **Meridian** centred, one column | **Summit** colour banner, right column |
| **Atlas** big name, light sidebar | **Harbor** serif, small caps | **Vertex** charcoal sidebar, timeline |
| **Chronicle** dates in their own column | **Ledger** compact, two columns | **Linen** headings in the margin |
| **Prism** angled colour header | **Campus** education first, for students | **Silicon** compact IT layout |
| **Keystone** the classic serif CV | **Beacon** clean single column | |

![Templates](docs/templates.png)

## Running it

Needs Node 20 or later.

```bash
npm install
npm run dev
```

`npm run dev` and `npm run build` first copy the PDF reader's worker into `public/`
(`scripts/copy-pdf-worker.mjs`), so importing PDFs works without any setup.

Then open http://localhost:3000.

```bash
npm run build && npm start      # production build
```

It deploys to Vercel, Netlify or any Node host as a normal Next.js app. All routes are prerendered; the query-based editor loads its document from browser storage.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
npx playwright install chromium   # once
npm run test:e2e                  # starts the built app on port 3210 and drives it
```

`tests/e2e.spec.mjs` runs in a real browser: the landing page, creating CVs, typing on the page,
undo and redo, Enter and Backspace in bullets, bold, the section and entry toolbars, adding,
hiding and rearranging sections, themes, backgrounds, fonts, layouts and skill styles, all fifty-six
templates keeping the content, phrases, long CVs flowing onto more pages with nothing
overflowing, the PDF having one A4 page per sheet, reload, rename, duplicate, delete, download
and import (including files from the first version and old `.cvjson` files), blank CVs, and no
sideways scrolling on a phone.

## PDF

**Download PDF** opens the browser's print dialog with the page size already set, and only the
CV is printed. Choose **Save as PDF**. The text stays real, selectable text that applicant
tracking systems can read, and colours print even with *Background graphics* switched off.

A one click download with no dialog would need a server that renders the same page in a
headless browser (Playwright, as the tests use) and returns the file. The current app uses the free, browser-only print workflow.

## How it is built

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**.
- **zustand** keeps the library of CVs in local storage, with undo history for the open CV.
- **dnd-kit** for drag to reorder, **lucide** for icons, fonts through `next/font`.

| Path | Holds |
|---|---|
| `src/lib/types.ts` | the CV document: personal details, sections, design |
| `src/lib/templates.ts` | the fifty-six templates and the colour themes |
| `src/lib/rich.ts` | the small rich text format (bold, italic, underline) |
| `src/lib/sample.ts` | blank CV, section types and new section helpers |
| `src/lib/personas.ts` | worked examples for six kinds of job |
| `src/lib/dates.ts` | date formats |
| `src/lib/store.ts` | the library of CVs, saving, undo and redo |
| `src/lib/io.ts` | download and import, and bringing older saves up to date |
| `src/lib/score.ts` | the CV score |
| `src/lib/optimizer.ts` | line by line suggestions and their fixes |
| `src/lib/importText.ts` | reading an old CV from a PDF or text |
| `src/lib/phrases.ts` | ready made phrases |
| `src/components/cv/` | turns a CV into pages: blocks, measuring, pagination, editing on the page |
| `src/app/cv.css` | how every template looks, one block per template |
| `src/components/editor/` | the editor: toolbars, panels, drawers, what each button does (`ops.ts`) |
| `src/components/Dashboard.tsx` | My CVs |
| `src/app/page.tsx` | the landing page |
| `standalone/` | the earlier single HTML file version, still working on its own |

**Templates are a layout plus a look.** `templates.ts` says where the columns go and where the
name sits; `cv.css` styles it under `.tpl-<id>`. The same document feeds every template, which
is why switching never loses content. To add one, add an entry to `TEMPLATES` and a block of CSS.

**Editing on the page.** Every piece of text in a template is an `<Ed>` (`src/components/cv/edit.tsx`)
with a path such as `bul:<section>:<entry>:<n>`. In the editor it becomes contenteditable and
reports changes by path; `ops.ts` writes them into the document. The measuring copy of the page
renders the same markup and placeholders but is never editable, so pagination sees exactly what
you see. When typing pushes a block onto the next page, the caret follows it.

**Pagination.** The CV is cut into small blocks (a heading with its first entry, then each later
bullet), every block is measured off screen, and blocks are dealt onto pages column by column.
Page capacity is read from empty measuring pages, so templates can pad their columns however they
like. Fonts loading or a photo arriving trigger a re-measure.

## Free and private by design

Accounts, cloud sync and payments are outside the current scope. CVs, cover letters, backups,
and the optional local AI are free. No server receives document text. Browser profiles have
separate libraries; people using the same profile share its library. Export backups to move
work between devices or keep an independent copy.

## The sample CV

Alex Morgan does not exist. The email is on the reserved `example.com` domain, the phone number
is in the `07700 900000` block Ofcom keeps aside for drama, and the portrait is a drawn
placeholder, not a photograph.

## Workspace and storage

The marketing site, template gallery, and dashboard share a responsive visual system.
The template gallery includes search, category filters, and keyboard-accessible previews.
New CVs start blank by default; an optional worked example is available for each profession.
Every creation, duplicate, and import receives a separate CV ID. Editor state and undo history
reset when switching documents.

CVs are stored in this browser, without accounts or cross-device sync. Separate browser
profiles have separate libraries; people sharing the same browser profile share its library.
Download JSON backups to move CVs between devices. Use **Back up all documents** in the dashboard
to export every CV in one file (saved reusable snippets are not included). Import that file
to preview and restore its CVs as new copies; existing CVs are never overwritten. The app displays a persistent warning
when browser storage is unavailable or full. A damaged saved record does not block other CVs.

After starting a local server, run the focused workspace regression checks with:

```bash
BASE_URL=http://localhost:3000 node tests/library.spec.mjs
```

These check independent documents, reload persistence, duplication, separate browser
contexts, collection backup and restore, imported rich text, template search and previews,
and mobile/tablet overflow including editor settings panels. The broader
`npm run test:e2e` suite also covers editing, all templates, imports, pagination and PDF output.

## Complete application workflow

- `/cover-letters`: 56 cover letter styles using the same header, fonts, and palette as the CV templates.
- `/examples`: six fictional professional examples that open creation with the correct role and template selected.
- `/guides`: practical writing, tailoring, layout, cover letter, backup, and export guides.
- `/dashboard?import=1`: import a text-based PDF or text file, or paste an existing CV; review the extracted content before creating a document.
- **Matching cover letter** in a CV card menu or editor download menu carries over its personal details and design. Letters support inline paragraph editing, Enter to split paragraphs, undo/redo, page flow, writing prompts, a review checklist, and PDF/JSON/plain-text export.
- **Manage tags** in a document menu adds tags for language, company, role, or application stage. The dashboard filters CVs, cover letters, and tags, and searches names, roles, titles, and tags.
- **Recently deleted** retains deleted documents across reloads until explicitly removed. Restore them from the dashboard or download individual backups first.
- Open tabs synchronise local storage changes. Mutations read the latest saved library before writing, preserving CVs created in another tab and resetting outdated undo history when the open document changes externally.
- Unreadable or unsupported saved libraries are preserved. The save warning offers the original data for download, while new work remains available in memory for export.

The writing outline and keyword checker run locally. Optional **Free AI writing** uses an open-source Qwen2.5 model in a browser worker for rewrites, concise wording, profiles, letter paragraphs, and translation. It requires no account, API key, subscription, or usage payment. Loading it explicitly downloads about 550 MB from Hugging Face; text generation stays on the device. Cache availability, memory, speed, and model quality vary by browser and device. Every suggestion needs review before application, with undo and a guard against new numeric claims. Closing the panel frees model memory; its privacy section can remove downloaded model files without deleting documents. The built-in phrases and outlines remain available without this download. No tool verifies qualifications or employer ATS scores. PDF export uses the browser's **Save as PDF** workflow. Scanned PDFs require text recognition before import.

Run the complete audit regression suite against a running app:

```bash
BASE_URL=http://localhost:3000 npm run test:audit
```

The audit covers cross-tab edits, tagged document views, matching cover letters across all 56 templates, paragraph editing, PDF/text/JSON exports, deletion recovery, responsive photo cropping, original photo persistence, direct PDF import, 320px–1440px layouts, and unreadable-storage recovery. See [the audit and reference comparison](docs/product-audit.md).

Run `npm run test:ai` for opt-in, review, apply/undo, numeric-claim, cancellation, failure, and cache-isolation checks. This suite mocks the worker; real browser model download and inference are checked separately. The model is [Apache 2.0 licensed](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct).

For the real model integration check, run `BASE_URL=http://localhost:3000 npm run test:ai:real`.
It explicitly downloads about 550 MB and checks real inference, reviewed application, undo,
and the absence of remote text uploads. Use a dedicated `AI_TEST_PROFILE` directory to retain
its cache between runs; never use a personal browser profile for synthetic-data tests.

## Expanded marketing and Studio collection

The product-led homepage includes a working, temporary editor preview, live profile and
achievement changes, layout/colour controls, larger design previews, writing guidance,
matching cover letters, privacy explanations, career starting points and an eight-question FAQ.
Its example edits do not create or modify documents in the user's library.

The sixteen additional Studio designs are Atelier, Clarity, Metro, Boardroom, Plain, Focus,
Signature, Scholar, Strength, Whitespace, Bridge, Heritage, Versatile, Developer, Matrix and
Balance. All 56 designs are editable CVs and matching letters. Search supports the core style
terms: creative, basic, modern, executive, simple, functional, professional, college,
skill-based, minimalist, hybrid, traditional, general, IT, tech and combined.

`BASE_URL=http://localhost:3000 npm run test:marketing` checks the live preview, keyboard tabs,
content preservation, colour changes, responsive widths, collection filtering, style search,
template preview and creation selection.
