# CV Studio

A CV builder that lives in a single HTML file. Ten templates, colour schemes, photo upload,
ready made phrases, live page checks, PDF and Word export. No server, no build step to run it,
no account, no watermark. Double click `index.html` and start typing.

![The editor](docs/editor.png)

## Why it exists

The online builders do the job but they charge a subscription to download a clean PDF, they keep
your details on someone else's server, and you cannot take the thing with you. This is the same
job done as one file you own. It opens from a folder, a USB stick or an email attachment, works
with the wifi off, and saves your work in the browser as you type.

## Templates

Switching template keeps every word you have typed, so you can try all ten and pick.

![The ten templates](docs/templates.png)

| | | |
|---|---|---|
| **Classic** curved panel, sidebar left | **Modern** solid sidebar, caps headings | **Executive** colour banner, one column |
| **Professional** name left, contact right | **Minimalist** centred, airy, no colour blocks | **Creative** sidebar right, accent bars |
| **Timeline** rail and dots down the jobs | **Compact** two even columns for long CVs | **Elegant** serif, centred, small caps |
| **Bold** deep header with the photo in it | | |

## What it does

**Editing, straight on the page**
Click any line to change it. `Cmd B` for bold. `Enter` in a bullet starts the next one,
`Backspace` on an empty bullet removes it. Hover a row for its delete cross, hover a list for its
add button, hover a job or a section for arrows to move it and a cross to delete it. Click a
language dot to set the level, click a contact icon to swap it for one of fifteen others.
Empty fields show a faint dashed line so you can find them, and never print.

**Design**
Twelve colour schemes plus six of your own colour pickers. Twelve fonts, body and headings set
separately. Sliders for body size, heading size, name size, line spacing, section gaps, page
margins and sidebar width. Photo shape, size and zoom, and you drag the photo itself to move the
face inside its frame. Skills as dots, bars, tags or a plain list. Dates on the right, underneath
or hidden.

**Sections**
Drag to reorder. Move a section between the sidebar and the main column, hide it, or delete it.
Add work experience, education, courses, projects, profile, achievements, skills, languages,
certificates, hobbies, references, or anything custom.

**Ready made phrases**
Lines written for real trades: construction and site, electrical, drone and agriculture, driving
and warehouse, customer service, maintenance, teamwork, and profile openers. Click into a bullet,
then click a line to drop it in.

**Checks**
Page count, name, email, phone, profile length, whether each job carries enough detail, whether
bullets start with a doing word, blank boxes left behind, and a note on when a photo helps and
when to leave it off.

**Pages**
Long CVs flow onto more sheets on their own. A job that will not fit carries its last bullets
over rather than leaving half a page empty, and the sidebar artwork continues on later sheets.
**Fit** shrinks line spacing, then gaps, then type size, only as far as it needs to, to pull
everything back onto one page.

**Saving and export**
Autosave in the browser, undo and redo with `Cmd Z` and `Shift Cmd Z`, save a copy to a file and
open it again later, export a clean HTML version with no editor around it, export a simple Word
file, and print to PDF.

## Printing

Choose **A4** and margins **None**. The colours come out either way: every coloured shape is drawn
as SVG, a border, or text, never as a CSS background, so nothing disappears when Chrome's
*Background graphics* box is left unticked. That one detail is the usual reason a CV prints out
plain white.

## Getting started

```bash
open index.html          # macOS
```

Nothing to install. Chrome gives the best print result.

## Building from source

`index.html` is generated. The parts are split up only to make editing comfortable.

```bash
python3 src/build.py     # writes index.html
```

| File | Holds |
|---|---|
| `src/1-paper-and-ui.css.html` | the CV styles and the editor chrome |
| `src/2-markup.html` | the panel and canvas shell |
| `src/3-engine.js.html` | data model, templates, renderer, pagination |
| `src/4-app.js.html` | typing, panel wiring, exports, start up |
| `src/photo.jpg` | the picture the app starts with, embedded as base64 |
| `src/make-placeholder-photo.py` | draws that placeholder portrait |

The CV itself is a plain JSON document. Templates are render functions over that document, which
is why switching one never loses your content.

## Tests

Real browser, no mocks.

```bash
npm install
npx playwright install chromium
npm run test:all
```

`tests/studio.spec.mjs` covers editing, all ten templates, colours, sections, phrases, undo and
redo, the checks, fit to page, autosave across a reload, and that the PDF comes out as one A4 page
with background graphics switched off. `tests/multipage.spec.mjs` covers what happens past one
sheet: page counts on screen and in the PDF, bullets carrying over, sidebar art repeating, and
typing without losing the caret while the layout reflows.

## Layout

```
index.html                 the app, self contained
src/                       the parts it is built from, plus the build script
tests/                     browser tests
legacy/cv-editor.html      the first version, one template, kept for reference
examples/                  a finished CV as HTML and as PDF
docs/                      screenshots for this readme
```

## The sample CV

Everything the app opens with is invented. Jordan Blake does not exist, the portrait is drawn by
`src/make-placeholder-photo.py` rather than photographed, the email sits on the reserved
`example.com` domain, and the phone number is inside the `07700 900000` block that Ofcom keeps
aside for film and television, so neither can reach a real person.

To change the starting CV, edit `starterDoc()` near the top of `src/3-engine.js.html`, drop a new
`src/photo.jpg` in place, and run the build. Nothing else needs touching.
