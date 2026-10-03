# CV Studio

Build a professional CV with a live preview, ten polished templates and a clean PDF download.
Free, private (CVs stay in the browser) and no sign up.

![The editor](docs/editor.png)

## What it does

- **Landing page and template gallery** at `/` and `/templates`.
- **My CVs dashboard** at `/dashboard`: every CV with a live thumbnail. Create (from a worked
  example or a blank page, in any template), open, rename, duplicate, download a copy, delete,
  and import a saved copy.
- **Editor** at `/editor/<id>`:
  - **Content**: personal details with photo upload (cropped and shrunk in the browser), any
    contact details you like, and sections you can add, rename, hide, delete, drag to reorder
    and move between the sidebar and main column. Thirteen section types: profile, work
    experience, education, skills, languages, projects, certificates, courses, awards,
    volunteering, interests, references and custom.
  - Descriptions are plain text: a line starting with `- ` is a bullet and `**this**` is bold,
    with buttons for both, Enter continuing a bullet list, and **ready made phrases** by kind of
    work.
  - **Design**: twelve colours plus any custom colour, eleven fonts for headings and body, text
    size, line spacing, section spacing, margins, A4 or US Letter, photo shape or none, skill
    levels as dots, bars, tags or text, and contact icons on or off.
  - **Templates**: all ten drawn with your own CV, switch with one click and keep every word.
  - **Live preview** on real pages. Long CVs flow onto further pages, a job's later bullets carry
    over rather than leaving a gap, and a heading never sits alone at the bottom of a page. Click
    anything on the page to jump to it in the editor.
  - **CV score** with a reason for every point: contact details, profile length, detail in each
    job, skills, leftover placeholders and length.
  - **Undo and redo**, autosave, and **Download PDF**.

## Templates

| | | |
|---|---|---|
| **Aurora** colour sidebar with photo | **Meridian** centred, one column, ATS friendly | **Summit** colour banner, right column |
| **Atlas** big name, light sidebar | **Harbor** serif, small caps, executive | **Vertex** charcoal sidebar, timeline |
| **Chronicle** dates in their own column | **Ledger** compact, two columns | **Linen** minimal, headings in the margin |
| **Prism** angled colour header | | |

![Templates](docs/templates.png)

## Running it

Needs Node 20 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

```bash
npm run build && npm start      # production build
```

It deploys to Vercel, Netlify or any Node host as a normal Next.js app. Every page except the
editor is static.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
npx playwright install chromium   # once
npm run test:e2e                  # starts the built app on port 3210 and drives it
```

`tests/e2e.spec.mjs` runs in a real browser: the landing page, creating CVs, typing, undo and
redo, adding and hiding sections, design settings, all ten templates keeping the content, long
CVs flowing onto more pages with nothing overflowing, the PDF having one A4 page per sheet,
reload, rename, duplicate, delete, download and import (including old `.cvjson` files), blank
CVs, and no sideways scrolling on a phone.

## PDF

**Download PDF** opens the browser's print dialog with the page size already set, and only the
CV is printed. Choose **Save as PDF**. The text stays real, selectable text that applicant
tracking systems can read, and colours print even with *Background graphics* switched off.

A one click download with no dialog would need a server that renders the same page in a
headless browser (Playwright, as the tests use) and returns the file. That is a natural paid or
signed in feature later.

## How it is built

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**.
- **zustand** keeps the library of CVs in local storage, with undo history for the open CV.
- **dnd-kit** for drag to reorder, **lucide** for icons, fonts through `next/font`.

| Path | Holds |
|---|---|
| `src/lib/types.ts` | the CV document: personal details, sections, design |
| `src/lib/templates.ts` | the ten templates: layout, header, colours, fonts |
| `src/lib/sample.ts` | the example CV, blank CV and new section helpers |
| `src/lib/store.ts` | the library of CVs, saving, undo and redo |
| `src/lib/io.ts` | download and import, including files from the old single file app |
| `src/lib/score.ts` | the CV score |
| `src/lib/phrases.ts` | ready made phrases |
| `src/components/cv/` | turns a CV into pages: blocks, measuring, pagination |
| `src/app/cv.css` | how every template looks, one block per template |
| `src/components/editor/` | the editor: content, design, templates, preview |
| `src/components/Dashboard.tsx` | My CVs |
| `src/app/page.tsx` | the landing page |
| `standalone/` | the earlier single HTML file version, still working on its own |

**Templates are a layout plus a look.** `templates.ts` says where the columns go and where the
name sits; `cv.css` styles it under `.tpl-<id>`. The same document feeds every template, which
is why switching never loses content. To add one, add an entry to `TEMPLATES` and a block of CSS.

**Pagination.** The CV is cut into small blocks (a heading with its first entry, then each later
bullet), every block is measured off screen, and blocks are dealt onto pages column by column.
Page capacity is read from empty measuring pages, so templates can pad their columns however they
like. Fonts loading or a photo arriving trigger a re-measure.

## Accounts and payments

Nothing needs a server today. To run CV Studio as a product with sign in and paid extras:

**Accounts and sync.** Add an auth provider (Supabase Auth, Clerk or Auth.js) and a `cvs` table
with `id`, `owner_id`, `title`, `data` (JSON), `design` (JSON), `created_at` and `updated_at`,
protected so each person reads only their own rows (row level security on Supabase). All storage
goes through `src/lib/store.ts`, so its actions become write through calls to that table, with
local storage kept as an offline cache. On first sign in, offer to upload the CVs already in the
browser. Move photos out of the JSON into file storage (Supabase Storage or S3).

**Payments.** Stripe Checkout for a subscription or one off purchase, a webhook that records the
plan on the account, and the app reading the plan to unlock features. Good candidates for paid
features are the ones that need a server anyway: sync across devices, one click PDF without the
print dialog, a shareable online CV link, cover letters, and AI help rewriting bullets.

**Before charging anyone.** A privacy policy and terms (a CV is personal data, and UK GDPR or
GDPR applies), real account deletion, backups, error monitoring, and your own domain and brand.

## The sample CV

Alex Morgan does not exist. The email is on the reserved `example.com` domain, the phone number
is in the `07700 900000` block Ofcom keeps aside for drama, and the portrait is a drawn
placeholder, not a photograph.
