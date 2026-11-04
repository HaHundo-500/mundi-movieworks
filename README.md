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
