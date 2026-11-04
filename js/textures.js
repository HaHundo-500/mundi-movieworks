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

  /* ---- Live moiré: two line grids, one turns with the mouse ---- */
  function moire(el, layer) {
    const gap = parseFloat(el.dataset.lines ?? 3);
    layer.classList.add('is-moire');
    layer.style.setProperty('--gap', gap + 'px');
    layer.innerHTML = '<i></i><i></i>';
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

  document.querySelectorAll('[data-texture]').forEach(setup);
  if (!calm) requestAnimationFrame(tick);
})();
