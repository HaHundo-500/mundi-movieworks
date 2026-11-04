# Handover — Mundi Movieworks website

Context for an AI assistant picking up this project. Last updated 2026-11-04.

## The person
- Aidyn Macfarlane, sole-trader videographer/editor in Coburg, Melbourne. Business working name: **Mundi Movieworks**.
- **Learning to code; cannot read HTML fluently yet.** Explain in plain words, briefly.
- Wants: short answers, honest (not flattering) feedback, actual commands to run (Windows CMD), and to keep creative control.
- **Do not change values or settings unless asked.** Make one change at a time and say exactly where it is (file + line, or the setting name to search for).
- Finds changes via VS Code Source Control (Ctrl+Shift+G) or Ctrl+F on a setting name.

## Setup
| Item | Value |
|---|---|
| Local folder | `E:\Business\Website\mundi_movieworks` (Windows) |
| Repo | github.com/HaHundo-500/mundi-movieworks, branch `main` |
| Live site | https://mundimovieworks.netlify.app (Netlify, auto-deploys from `main`) |
| Publish | VS Code: Terminal → Run Task… → **Publish site** (`.vscode/tasks.json`: add, commit with dated message, pull, push) |
| Preview | Live Server (refreshes on save). The built-in VS Code preview opens `file:///` and needs manual ↻ refresh. |
| Stack | Plain HTML/CSS/JS. No framework, no build step. Keep it that way. |

Git commands must run **inside the site folder** (`cd /d E:\Business\Website\mundi_movieworks`). Running them in `C:\Users\PC` once turned the whole user folder into a repo — avoid.

Don't use Netlify's built-in AI agent for edits: it works on its own copy and drifts from this folder.

## File map
| Path | Role |
|---|---|
| `index.html` | Home: intro (logo + title), Arrivals log, featured reel, index of pages |
| `reel.html`, `services.html`, `credits.html`, `about.html`, `contact.html` | One page per section |
| `lab.html` | **Texture Lab** test page, not in the menu. Each panel shows its settings |
| `_template.html` | Copy to make a new page; then add it to `MENU` in `js/site.js` |
| `css/base.css` | Layout only (grid, blocks, texture layers) |
| `css/theme.css` | The look: colour/type tokens at the top |
| `js/site.js` | Shared header, menu (`MENU` array) and footer for every page |
| `js/textures.js` | Texture system (see below) |
| `js/intro.js`, `js/phonemic.js`, `js/scenes.js` | **Stubs, not built yet** — comments describe the plan |
| `media/logo/` | Placeholder logo: Fool's Cap Map (c. 1590) recoloured to the palette |
| `media/stills/` | Portrait (`aidyn-portrait.jpg`), *No Farewell* stills (`no-farewell/`) |
| `media/reel/` | 2022 showreel (placeholder) + poster frame |
| `media/textures/<pack>/` | Texture packs: `noise/`, `dither/`, `stipple/` |
| `_archive/` | Old WinWord-style version, kept for reference |

## Design
- Dark mode only. Tokens in `css/theme.css`:
  - `--bg #1b1b1b` (Eerie Black), `--line #6D7C7A` (granite), `--accent #123524` (phthalo green), `--text #e4dfd4` (bone), `--muted #8f897e`.
  - Phthalo on Eerie Black is very low contrast (≈1.3:1): fine as a fill or tint, nearly invisible as thin lines or small marks.
- Fonts (Google Fonts): **Libertinus Mono** titles/menu/dates, **IBM Plex Sans Condensed** body, **Libertinus Serif** for phonemic/IPA text (the other two have no IPA glyphs).
- Layout: header / menu column / main / margin column (symbols, notes); stacks to one column on phones.

## Concept (the "why")
- How the senses and language shape perception: out of garbled syllables, visions form — where the viewer directs attention (mouse, scroll).
- Interests: symbols, archetypal imagery, semiotics, cosmological diagrams (monomyth with *Axis Mundi*, Flammarion engraving, Gnostic cosmos), HyperCard-era interfaces, his own night photography (light trails, motion blur, theatre).
- Structure is Web1 / personal-site, aesthetic is its own era. Inspired by ec0rypt.com's layout logic, **not** its look.
- Rule: **attention reveals beauty, never information.** Menu, contact and reel always stay readable. Respect `prefers-reduced-motion`.
- Reference doc with images: "Mundi Movieworks — Site Ideas & References" (Claude Docs).

## Texture system (`js/textures.js`)
Add `data-texture` to any element; a layer is added over it (or under with `data-layer="under"`).

| Attribute | Meaning |
|---|---|
| `data-texture` | PNG/JPG tile, WebM/MP4 loop (an `.mp4` of the same name is the fallback), or `moire` |
| `data-scale` | Screen px per texture px |
| `data-stretch` | e.g. `4x1` |
| `data-render` | `pixelated` or `smooth` |
| `data-fit` | `tile` (default) or `cover` |
| `data-fps` | Crackle rate (random jumps); `0` = still |
| `data-opacity`, `data-blend` | Strength, CSS blend mode (default `screen`) |
| `data-layer` | `over` (default) or `under` |

Moiré only: `data-lines` (px spacing), `data-react="mouse"|"scroll"`. Scroll mode adds `data-color-from`, `data-color-to`, `data-color-hold` (exponent; higher = first colour lasts longer), `data-stretch-amount`, `data-parallax` (0–1), `data-beat` (second grid spacing ratio; closer to 1 = bigger bands), `data-twist` (degrees of warp by page end).

Layers only animate while on screen; static under reduced motion.

**Current home page:** stipple theatre behind the intro (`opacity 0.35`, cover, under); moiré on `.site` in scroll mode (green → Eerie Black, hold 3, parallax 0.5, beat 1.12, twist 6, opacity 0.9). The user has said the moiré is still subtle — the colours are close in brightness.

**Texture naming/export spec:** `media/textures/<pack>/<pack>-<source>-<variant>.<ext>`. Loops 2–4 s, ≤720p, 8–12 fps, <2 MB, WebM + MP4. Tiles as small PNGs (64–256 px). Current noise textures are script-generated placeholders; dither/stipple come from his photos.

## Pixelate effect (`js/pixelate.js`)
An image drawn on a canvas behind an element's content, split into a grid; each cell shows the image at its own pixel size, chosen by a drifting blob field ("amoeba meets JPG artifact"). The canvas sticks in view like a fixed background.

| Attribute | Meaning |
|---|---|
| `data-pixelate` | Image path |
| `data-amount` | Break-up at rest, **0–1** (0 = sharp when still) |
| `data-burst` | Extra break-up from scrolling (faster scroll = more) |
| `data-settle` | Seconds to fade back to sharp (even, linear fade) |
| `data-blob`, `data-cell`, `data-sizes` | Blob size, grid size (px), pixel sizes available |
| `data-dim` | Darken 0–1 |
| `data-twinkle` | Patches per second that flash into JPG blocks while still; placed on bright areas |
| `data-focus`, `data-focus-hold` | Sharp radius around the mouse (px); seconds a passed-over spot stays sharp |
| `data-mouse-clear` | Px of mouse travel that clears the pixelation fully |

**Current home page:** cover `media/stills/20231217_034014.jpg` and page background `media/stills/20231217_033849 (1).jpg` (dim 0.75). Both: amount 0, settle 15, focus 48, focus-hold 3, mouse-clear 900, twinkle 2 / 1.5. The CSS background on `.site` in `base.css` is a fallback if the script can't run. The moiré was removed from the home page by the user.

**Editing gotcha:** when VS Code says a file changed on disk, choose Revert/Reload, not Overwrite, or older content gets saved over newer changes.

## Planned next
1. **Real noise captures** (digicam high-ISO, tape, scanner, re-saved JPG) → process in TouchDesigner or Fusion (Resolve) into texture packs. Browser does the reacting; TD/Fusion only design and export.
2. **`phonemic.js`**: headings show their IPA (`data-phonemic` already on headings) emerging from noise/dither, resolving to English as they scroll into view, degrading (JPG blocks, scanner smear, clipping) as they leave. Real text must stay in the DOM.
3. **`intro.js`**: logo + title fill the screen, then settle into the header as you scroll.
4. Final logo (redraw the Fool's Cap or keep the engraving — undecided).
5. Place *No Farewell* stills (on Credits, or its own page — undecided). The 48HR credit could name the film.
6. `scenes.js` (layered materialising video) is **on hold** — the user doesn't plan to edit footage into layers for now.

## Open content questions
- Get the mentor's OK before publishing client names (VEC, NCR Atleos, Thales); live-stream credits are as crew with Moment 2 Moment.
- Movember appears on his resume with no role stated — ask before adding.
- Phone number is in `contact.html` but commented out (his choice to show).

## Gotchas
- `lab.html` captions under each panel are static text; they don't update when settings change.
- Google Fonts must load for the right look; offline previews fall back to system fonts.
- LF/CRLF warnings from Git on Windows are harmless.
