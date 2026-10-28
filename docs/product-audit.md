# Product audit and reference comparison

Reviewed 26 October 2026. The app remains private and browser-only, as requested.

## Reference scope

The comparison uses Novorésumé's public homepage, template and cover-letter pages, and its published help documentation. No paid account or private editor was accessed. The implementation uses original copy, layouts, and assets.

Sources: [public builder overview](https://novoresume.com/), [cover-letter builder](https://novoresume.com/cover-letter-maker), [platform feature guide](https://intercom.help/novoresume/en/articles/13130837-welcome-to-novoresume-2-0), and [document organisation guide](https://intercom.help/novoresume/en/articles/13130815-my-documents-manage-all-your-resumes-and-cover-letters-2-0).

## Application features

| Workflow | CV Studio |
| --- | --- |
| Template selection | 65 searchable, filterable CV designs, previewed before creation and with the user's content inside the editor |
| Document editing | Inline editing, undo/redo, multiple columns, section controls, rearrangement, 22 section types, paper sizes, margins, fonts, themes, backgrounds, photo cropping, and date/rating styles |
| Matching cover letters | Create from a CV with matching identity and design; write inline or in a guided panel; split paragraphs with Enter; review before export |
| Writing assistance | Optional free on-device AI for rewriting, shortening, profiles, letter paragraphs and translation; role-specific phrases, an achievement optimizer, reusable content, an explainable checklist, and a letter outline using existing CV achievements |
| Job tailoring | Persistent job descriptions and keyword overlap checks; duplication keeps application-specific versions separate |
| Document organisation | Unified CV/letter library, document-type views, editable tags, tag filtering, search and sorting |
| Import | PDF/text import directly from the dashboard or inside the editor, pasted text, individual JSON backups, collections, and legacy CV formats |
| Export | Selectable-text PDF through browser printing, portable JSON copies/collections, and plain-text downloads |
| Learning | Six fictional professional CV examples and six original writing/workflow guides |
| Data recovery | Persistent Recently deleted, restoration, individual deleted-document backups, save-failure notices, and preservation/download of unreadable saved data |
| Responsive/accessibility | Phone/tablet/desktop navigation, labelled form controls, keyboard menus, modal focus containment and restoration, mobile editor panels, and responsive photo cropping |
| Performance | Only visible/nearby thumbnails mount document renderers; optional template fonts are loaded when used instead of preloading the entire font catalogue |

## Fixed audit findings

- An older open tab could overwrite CVs created in another tab. Local storage events now update other tabs; mutations refresh their state before writing. Undo history resets when its document changes externally.
- Deleting a CV was permanent. Documents now move to Recently deleted, survive reloads there, and can be restored.
- Unreadable saved data could be replaced by a new empty library. Writes are now blocked in that state, with an original-data download and clear save feedback. The warning can be minimised and reopened from the save status; it does not cover creation dialogs.
- Original uncropped photos were discarded when normalising a saved CV. Photo sources now survive reloads and backups, and the cropper fits narrow screens.
- Malformed files could introduce invalid design settings, duplicate/unsafe editing IDs, broken saved entries, or remote photo URLs. Normalisation now handles those cases.
- Imported rich text could carry active HTML. Rendering accepts only the supported text formatting; parsing uses an inert template element.
- Contact links inside dashboard thumbnails produced nested links. Links are present in the editor/PDF and do not create interactive links inside thumbnail links.
- New users had little guidance in the editor. Creation can prefill their name and role; a blank document provides an editing hint and a personal-details action.
- Job descriptions disappeared when the ATS panel closed. Each CV now stores its own job description.
- Menus and grouped controls lacked consistent keyboard/focus behaviour and accessible names. Those interactions now have explicit labels, state, keyboard navigation, and focus restoration.
- Phone settings panels, navigation, image cropping, and desktop preview sizing had layout problems. Their dimensions and available space are now accounted for.
- PDF import workers stayed alive after reading a file. The loading task is now destroyed after success or failure.
- Missing and loading pages used generic/blank fallbacks. They now offer branded status, navigation, and retry/recovery interfaces.

## Boundaries

- Storage remains within the current browser profile. There are no hosted accounts, cloud syncing, public document links, billing, or hiring analytics.
- Cloud generative AI is not connected. Optional AI and translation run in a browser worker using the Apache 2.0 Qwen2.5-0.5B model. Loading requires explicit opt-in and about 550 MB of model/runtime downloads from Hugging Face, with no API key or usage billing. Browser cache, available memory, performance, and suggestion quality vary. Output needs review; a numeric-claim guard, stale-field check and undo protect application. Existing phrases and outlines need no model download. Keyword comparisons are not presented as employer ATS scores.
- PDF import reads text-based PDFs; it does not perform OCR. PDF download uses the browser print window and preserves a real text layer.
- Browser storage has device-dependent limits. Save warnings identify failed writes; JSON backups make documents portable. Active-document collections do not include deleted documents or reusable saved snippets.
- Cross-tab syncing supports local document use, not real-time collaborative editing. Concurrent changes to the same field can use the latest saved value.

## Verification

The repository includes five browser suites, plus an opt-in real-model check:

- `npm run test:e2e`: CV editing, all templates, typography/layout controls, ATS checks, saved content, multi-page flow, PDF export, imports, legacy formats, duplication, rename, and mobile checks.
- `npm run test:library`: independent CVs, browser isolation, collection export/restore, malformed-file rejection, template previews, save failures, rich-text sanitisation, and mobile settings panels.
- `npm run test:audit`: cross-tab edits, keyboard/focus behaviour, tags and views, all 56 matching-letter templates, paragraph splitting, letter export/reimport, deleted-document recovery, photo persistence, unreadable-data preservation, direct PDF import, public recovery pages, and responsive layouts.

- `npm run test:ai`: opt-in, review before application, numeric-claim guard, apply/undo, worker cleanup, cancellation, failure, and model-cache isolation. This suite uses a mocked worker; real model inference is a separate integration check.

- `npm run test:marketing`: live preview editing, content-preserving design switches, colour controls, reset, keyboard tabs, library isolation, 56-template gallery, Studio filtering, style search, creation selection and responsive layouts.

Use `BASE_URL` to run these against a running production server. Build and code checks: `npm run build`, `npm run typecheck`, `npm run lint`, and `git diff --check`.

### Completed checks

The final production build, TypeScript check, lint, and whitespace checks passed. All five browser suites passed against the production server with no browser runtime errors. The CV suite also reports no browser console errors.

Visual checks covered the creation dialog, full marketing pages, matching-letter previews, the desktop editor, and phone settings/photo controls. Thumbnail and paper dimensions remain stable while fonts and off-screen previews load. The public cover-letter page has two font preloads; other template fonts load when used.

## Free local AI and dependencies

The optional model is pinned to revision `22942cb7d7ba4cc81bb4673549ca4d4614469b5e`; inference uses Transformers.js 4.3.1 with single-threaded CPU WASM. It runs outside the UI thread and needs no cross-origin isolation headers. The model can be removed independently of CV storage. Sources: [model and licence](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct), [browser inference documentation](https://huggingface.co/docs/transformers.js/index).

Next.js and its ESLint configuration were upgraded to 16.4.3 and dependency advisories were resolved. `npm audit` reports zero known vulnerabilities at the time of this audit.

The real-model check (`npm run test:ai:real`) passed in Chromium using CPU WASM, including
model download, a factual rewrite, reviewed application, undo, and no remote text upload.
The verified rewrite preserved both the supplied number and who used the reports. This is
an integration check, not a guarantee of accuracy for other suggestions. A persistent test
profile also loaded the cached model on the next run. Incognito/cache-limited contexts can
fail to retain large model files; the panel reports that condition and keeps the editor usable.

Both the normal production build and `STATIC_EXPORT=1 PAGES_BASE_PATH=/cv-studio npm run build`
passed. A browser probe of the exported subfolder site verified creation, reload persistence,
rendered template previews, and correct AI/PDF worker asset URLs. The normal production build
was restored after this deployment check.

## Second marketing and template pass

The reference's current public pages were reviewed again, including its sixteen core
resume styles and larger collections organised by career stage and layout. The homepage
was rebuilt with a working editor demonstration, larger editorial typography, full product
sections, a writing example, matching-letter presentation, career starting points, privacy
cards, and a more complete FAQ. No third-party testimonials, employer endorsements, hiring
statistics, branded sample documents or template image assets are reproduced.

The library now contains 56 editable designs. The additional Studio collection covers the
sixteen core style families with original implementations:

| Style family | Studio design |
| --- | --- |
| Creative | Atelier |
| Basic | Clarity |
| Modern | Metro |
| Executive | Boardroom |
| Simple | Plain |
| Functional | Focus |
| Professional | Signature |
| College | Scholar |
| Skill-based | Strength |
| Minimalist | Whitespace |
| Hybrid | Bridge |
| Traditional | Heritage |
| General | Versatile |
| IT | Developer |
| Tech | Matrix |
| Combined | Balance |

These are original editable layouts, not an assertion of pixel-for-pixel parity with the
reference's catalogue. Category previews on the reference also include named variations
and multi-page examples; their presence does not imply a separate editor implementation
was accessed. The existing template system supports multi-page CVs and matching letters.

Verification for the second pass: production build, lint, and whitespace checks passed.
The CV suite rendered all 56 designs and passed editing, pagination, PDF, import and mobile
checks. The audit suite exercised all 56 matching-letter designs. Library, optional-AI UI,
and the new marketing suite passed with no browser runtime errors. Desktop and phone visual
reviews covered the live product preview, template collection, writing example and matching
CV/letter presentation.

## Brand and premium design pass — 28 October 2026

The existing collection included many photo-led and strongly decorated layouts. The Edit
adds nine quieter designs in three groups: Forma/Folio/Still (simple), Aurelia/Serein/Opal
(elegant), and Vector/Signal/Arc (futuristic). All are original, free to use, and default to
no photo. Saved documents keep their existing photo preference when switching templates.
The full library now contains 65 CV designs and matching letter styles.

The CV Studio logo is a native vector monogram combining an open C with an ascending V.
Forest `#173F35`, soft lime `#D1E5AA` and ivory `#F6F7EC` preserve the site's existing tone.
The shared logo component updates marketing navigation, dashboard and footer usage. The
browser and home-screen icons use the same artwork; reusable SVG assets are in `public/brand/`.
Metadata descriptions and visible template counts reflect the expanded collection.

Brand exports include self-contained dark/light wordmarks with outlined DM Sans lettering,
so downloaded SVGs do not require a font installation or a network request. No raster model
or paid asset service is required to display the logo.

Validation: the production build, TypeScript compilation, lint and whitespace checks passed.
The full CV suite rendered all 65 templates and passed; the audit suite exercised all 65
matching-letter designs. Library, marketing, AI interface and The Edit suites also passed.
The focused suite verifies all nine no-photo creation flows, page bounds, PDF page counts,
independent document IDs, template switching, mobile fit, icon assets and reload persistence.
Visual review covered the three design families, the new wordmark, and a rendered PDF.
