/* =========================================================
   textures.js — texture packs as layers on any block.

   HOW TO USE: add data-texture to any element. The texture
   is laid over it (or under it, with data-layer="under").

   Image texture (tiles across the block):
     <div data-texture="media/textures/noise/noise-blocky-01.png"
          data-scale="12" data-render="pixelated" data-fps="10"></div>

   Video texture (one loop, stretched to the block):
     <div data-texture="media/textures/noise/noise-loop-01.webm"></div>

   Live moiré (no file needed):
     <div data-texture="moire" data-lines="3"></div>

   SETTINGS (all optional):
     data-scale    how many screen pixels per texture pixel (default 1)
     data-stretch  stretch the tile, width x height, e.g. "4x1" (default 1x1)
     data-render   "pixelated" = hard blocky pixels, "smooth" = soft (default smooth)
     data-fit      "tile" = repeat (default), "cover" = one image filling the block
     data-fps      crackle rate: how often the tile jumps (0 = still, default 0)
     data-opacity  0 to 1 (default 0.5)
     data-blend    CSS blend mode, e.g. screen, overlay, difference (default screen)
     data-layer    "over" (default) or "under" the block's content
     data-lines    moiré only: line spacing in px (default 3)
   ========================================================= */

(function () {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ticking = new Set();   // layers currently crackling (only those on screen)

  function setup(el) {
    const src = el.dataset.texture;
    const layer = document.createElement('div');
    layer.className = 'texture-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.opacity = el.dataset.opacity ?? 0.5;
    layer.style.mixBlendMode = el.dataset.blend ?? 'screen';
    if (el.dataset.layer === 'under') layer.classList.add('is-under');

    if (src === 'moire') {
      moire(el, layer);
    } else if (/\.(webm|mp4)$/i.test(src)) {
      video(el, layer, src);
    } else {
      image(el, layer, src);
    }

    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.classList.add('has-texture');
    el.prepend(layer);
  }

  /* ---- Image tiles: scaled, stretched, crackling ---- */
  function image(el, layer, src) {
    const scale = parseFloat(el.dataset.scale ?? 1);
    const [sx, sy] = (el.dataset.stretch ?? '1x1').split('x').map(Number);
    const fps = parseFloat(el.dataset.fps ?? 0);
    layer.style.backgroundImage = `url("${src}")`;
    layer.style.imageRendering = el.dataset.render === 'pixelated' ? 'pixelated' : 'auto';

    if (el.dataset.fit === 'cover') {
      layer.style.backgroundSize = 'cover';
      layer.style.backgroundPosition = 'center';
      layer.style.backgroundRepeat = 'no-repeat';
    } else {
      // Read the tile's real size, then scale and stretch it
      const img = new Image();
      img.onload = () => {
        layer.style.backgroundSize = `${img.width * scale * sx}px ${img.height * scale * sy}px`;
      };
      img.src = src;
    }

    if (fps > 0 && !calm) {
      layer.crackle = { every: 1000 / fps, last: 0, step: scale };
      watch(el, layer);
    }
  }

  /* ---- Video loop, stretched to the block ---- */
  function video(el, layer, src) {
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = !calm;
    v.setAttribute('muted', '');
    // WebM first; an .mp4 with the same name is used where WebM isn't supported
    const base = src.replace(/\.(webm|mp4)$/i, '');
    v.innerHTML = `<source src="${base}.webm" type="video/webm"><source src="${base}.mp4" type="video/mp4">`;
    v.style.imageRendering = el.dataset.render === 'pixelated' ? 'pixelated' : 'auto';
    layer.appendChild(v);
    // Pause when off screen to save battery
    new IntersectionObserver(([e]) => { if (calm) return; e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }).observe(el);
  }

  /* ---- Live moiré: two line grids laid over each other ----
     data-react="mouse"  (default) one grid turns with the mouse
     data-react="scroll" the grids stretch as you scroll, and the lines
                         change colour from data-color-from to data-color-to
     data-parallax="0.4" the grids lag behind the page as you scroll
                         (0 = move with the page, 1 = stay fixed on screen).
                         The second grid moves at a different speed, so the bands slide.
     data-beat="1.12"    spacing of the second grid vs the first (closer to 1 = bigger bands)
     data-twist="6"      degrees the bands warp by the bottom of the page
     data-color-hold="3" how long the first colour holds (1 = even fade, higher = later fade) */
  function moire(el, layer) {
    const gap = parseFloat(el.dataset.lines ?? 3);
    layer.classList.add('is-moire');
    layer.style.setProperty('--gap', gap + 'px');
    layer.style.setProperty('--gap2', (gap * parseFloat(el.dataset.beat ?? 1.12)) + 'px');  // spacing difference = band size
    layer.innerHTML = '<i></i><i></i>';

    if (el.dataset.react === 'scroll') {
      const from = hex(el.dataset.colorFrom ?? '#123524');
      const to   = hex(el.dataset.colorTo   ?? '#1b1b1b');
      const STRETCH = parseFloat(el.dataset.stretchAmount ?? 3);  // how far the lines pull apart
      const PARALLAX = parseFloat(el.dataset.parallax ?? 0);       // 0 = no parallax
      const TWIST = parseFloat(el.dataset.twist ?? 6);             // degrees the bands warp by the bottom
      const HOLD = parseFloat(el.dataset.colorHold ?? 1);          // 1 = even fade, 3 = green holds until near the bottom
      const update = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        const p = max > 0 ? Math.min(Math.max(scrollY / max, 0), 1) : 0;  // 0 at top, 1 at bottom
        layer.style.setProperty('--sa', 1 + p * STRETCH);         // first grid stretches
        layer.style.setProperty('--sb', 1 + p * STRETCH * 1.15);  // second stretches a bit more → bands move
        layer.style.color = mix(from, to, Math.pow(p, HOLD));   // HOLD > 1 keeps the first colour for longer
        layer.style.setProperty('--pa', (scrollY * PARALLAX) + 'px');         // back grid
        layer.style.setProperty('--pb', (scrollY * PARALLAX * 0.55) + 'px');  // front grid moves at a different speed → bands slide
        layer.style.setProperty('--turn', (2 + p * TWIST) + 'deg');           // angle between grids grows → bands warp
      };
      update();
      if (!calm) { addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); }
      return;
    }

    if (calm) return;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      layer.style.setProperty('--turn', (x * 8) + 'deg');      // small turns = big shifts
      layer.style.setProperty('--zoom', 1 + y * 0.06);
    });
  }

  /* ---- Crackle: jump the tile to a random offset, at a low frame rate ---- */
  function watch(el, layer) {
    new IntersectionObserver(([e]) => {
      e.isIntersecting ? ticking.add(layer) : ticking.delete(layer);
    }).observe(el);
  }
  function tick(now) {
    for (const layer of ticking) {
      const c = layer.crackle;
      if (now - c.last < c.every) continue;
      c.last = now;
      const x = Math.floor(Math.random() * 64) * c.step;
      const y = Math.floor(Math.random() * 64) * c.step;
      layer.style.backgroundPosition = `${x}px ${y}px`;
    }
    requestAnimationFrame(tick);
  }

  /* ---- Colour helpers ---- */
  function hex(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
  function mix(a, b, t) { return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`; }

  document.querySelectorAll('[data-texture]').forEach(setup);
  if (!calm) requestAnimationFrame(tick);
})();
