# Mundi Movieworks — site bones

Open `index.html` in a browser to view. No install needed.

## Where things live
| File / folder | What it does |
|---|---|
| `index.html` | Home: intro, log ("Arrivals"), featured scene, index of pages |
| `reel.html`, `services.html`, `credits.html`, `about.html`, `contact.html` | One page per section |
| `_template.html` | Copy this to make a new page |
| `css/base.css` | Layout only (grid, blocks). Wireframe on purpose |
| `css/theme.css` | The look: fonts, colours, ornament (empty for now) |
| `js/site.js` | Header, menu and footer for every page. Edit the menu here |
| `js/intro.js` | Home intro animation (not built yet) |
| `js/phonemic.js` | Phonemic text that resolves into English (not built yet) |
| `js/scenes.js` | Layered video that materialises in order (not built yet) |
| `media/scenes/` | Video layers (MP4/WebM) |
| `media/stills/` | Photos |
| `ascii/` | ASCII art pieces |
| `symbols/` | Symbol/glyph images (SVG) |
| `_archive/` | Old versions |

## Common jobs
- **Add a log entry:** in `index.html`, copy an `<article class="log-entry">` and paste it at the top of the log.
- **Add a page:** copy `_template.html`, rename it, then add it to `MENU` in `js/site.js`.
- **Add a scene layer:** inside a `<figure class="scene">`, add a `<video class="layer" data-layer="..." data-order="...">`. Lower `data-order` arrives first.
- **Give text a phonemic form:** add `data-phonemic="..."` to any heading.

## Textures (js/textures.js)
Add `data-texture` to any block to lay a texture over it. Test page: `lab.html` (not in the menu).

| Setting | What it does |
|---|---|
| `data-texture` | File path (PNG/JPG tile, or WebM/MP4 loop), or `moire` for live moiré |
| `data-scale` | Screen pixels per texture pixel |
| `data-stretch` | Stretch the tile, e.g. `4x1` |
| `data-render` | `pixelated` (hard blocks) or `smooth` |
| `data-fit` | `tile` (repeat) or `cover` (one image fills the block) |
| `data-fps` | Crackle rate; `0` = still |
| `data-opacity` / `data-blend` | Strength and CSS blend mode |
| `data-layer` | `over` (default) or `under` the content |

Texture files live in `media/textures/<pack>/<pack>-<source>-<variant>.<ext>`.
Export spec: loops 2–4s, ≤720p, 8–12fps, under 2 MB, WebM + MP4 copy; tiles as small PNGs.
