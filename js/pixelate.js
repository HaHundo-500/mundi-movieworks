/* =========================================================
   pixelate.js — an image broken into blocks of varying size,
   like an amoeba of JPG artifacts, driven by scroll.

   HOW TO USE: add data-pixelate to an element. The image is drawn
   behind the element's content and stays in view while you scroll
   through it (like a fixed background).

     <section data-pixelate="media/stills/photo.jpg"></section>

   SETTINGS (all optional):
     data-cell     grid size in px; each cell picks its own pixel size (default 24)
     data-sizes    the pixel sizes cells can use, smallest first
                   (default "1,2,4,8,16,32,64"; 1 = sharp)
     data-amount   how broken-up it is when you're NOT scrolling, 0–1 (default 0.35)
     data-burst    how much extra break-up scrolling adds, 0–1 (default 0.5)
     data-blob     size of the amoeba shapes in px (default 420)
     data-drift    how far the shapes travel per screen of scroll (default 1)
     data-dim      darken the image, 0–1 (default 0)
     data-settle   seconds to return to sharp after you stop scrolling (default 0.7)
     data-twinkle  while still, how many patches flick into JPG blocks per second
                   (default 0 = off; 1–3 is sparing, 8+ is busy)
     data-focus    radius in px around the mouse that turns sharp; blocks shrink
                   the closer they are to the pointer (default 0 = off)
     data-focus-hold  seconds a spot stays sharp after the mouse passes over (default 3)
     data-mouse-clear px of mouse movement that clears the pixelation completely
                   (default 0 = off; smaller = clears faster)
   ========================================================= */

(function () {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-pixelate]').forEach(el => {
    const o = {
      src:    el.dataset.pixelate,
      cell:   parseInt(el.dataset.cell ?? 24),
      sizes:  (el.dataset.sizes ?? '1,2,4,8,16,32,64').split(',').map(Number),
      amount: parseFloat(el.dataset.amount ?? 0.35),
      burst:  parseFloat(el.dataset.burst ?? 0.5),
      blob:   parseFloat(el.dataset.blob ?? 420),
      drift:  parseFloat(el.dataset.drift ?? 1),
      dim:    parseFloat(el.dataset.dim ?? 0),
      settle: Math.max(0.05, parseFloat(el.dataset.settle ?? 0.7)),
      focus:  parseFloat(el.dataset.focus ?? 0),
      hold:   parseFloat(el.dataset.focusHold ?? 3),
      clear:  parseFloat(el.dataset.mouseClear ?? 0),
    };

    // A full-size holder behind the content, with a screen-sized canvas that sticks in view
    const holder = document.createElement('div');
    holder.className = 'pixelate-layer';
    holder.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    holder.appendChild(canvas);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.classList.add('has-pixelate');
    el.prepend(holder);

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = encodeURI(o.src);

    let W = 0, H = 0, levels = [], energy = 0, lastY = scrollY, queued = false;
    // Focus memory: for each cell, how sharp the mouse made it, and until when
    let cols = 0, rows = 0, memF = new Float32Array(0), memUntil = new Float64Array(0);
    const mouse = { x: -9999, y: -9999 };

    // Draw the image to fill the screen (like background-size: cover), then
    // make a shrunken copy for each pixel size. Drawing a shrunken copy back up
    // with smoothing off is what makes the blocks.
    function build() {
      W = canvas.width = Math.ceil(holder.clientWidth);
      H = canvas.height = Math.ceil(Math.min(innerHeight, holder.clientHeight || innerHeight));
      if (!W || !H || !img.naturalWidth) return;
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      levels = o.sizes.map(px => {
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.ceil(W / px));
        c.height = Math.max(1, Math.ceil(H / px));
        const g = c.getContext('2d');
        g.imageSmoothingQuality = 'low';
        g.drawImage(img, (W - dw) / 2 / px, (H - dh) / 2 / px, dw / px, dh / px);
        if (o.dim > 0) { g.fillStyle = `rgba(27,27,27,${o.dim})`; g.fillRect(0, 0, c.width, c.height); }
        return { px, c };
      });
      cols = Math.ceil(W / o.cell); rows = Math.ceil(H / o.cell);
      memF = new Float32Array(cols * rows); memUntil = new Float64Array(cols * rows);
      draw();
    }

    // Smooth blobby field (the "amoeba"): a few slow waves added together
    function field(x, y, t) {
      const b = o.blob;
      return (Math.sin(x / b + t * 1.3) + Math.sin(y / (b * 0.8) - t) +
              Math.sin((x + y) / (b * 1.4) + t * 0.6) + Math.sin(Math.hypot(x - W / 2, y - H / 2) / (b * 0.6) - t * 1.7)) / 4;
    }
    // Tiny per-cell randomness, so edges break up like JPG blocks
    function hash(i, j) { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); }

    /* ---- Focus: 0 = no effect, 1 = fully sharp ---- */
    function liveFocus(cx, cy) {            // from where the mouse is right now
      if (!o.focus) return 0;
      const d = Math.hypot(cx - mouse.x, cy - mouse.y);
      return Math.max(0, 1 - d / o.focus);
    }
    function focusAt(x, y, now) {           // live focus, or what the mouse left behind
      const C = o.cell, cx = x + C / 2, cy = y + C / 2;
      let f = liveFocus(cx, cy);
      const k = Math.floor(y / C) * cols + Math.floor(x / C);
      const left = memUntil[k] - now;
      if (left > 0) f = Math.max(f, memF[k] * Math.min(1, left / 400));   // last 0.4 s eases back
      return f;
    }
    function remember() {                   // mark cells near the mouse as "recently looked at"
      if (!o.focus || !cols) return;
      const C = o.cell, now = performance.now(), until = now + o.hold * 1000;
      const x0 = Math.max(0, Math.floor((mouse.x - o.focus) / C)), x1 = Math.min(cols - 1, Math.floor((mouse.x + o.focus) / C));
      const y0 = Math.max(0, Math.floor((mouse.y - o.focus) / C)), y1 = Math.min(rows - 1, Math.floor((mouse.y + o.focus) / C));
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
        const f = liveFocus(i * C + C / 2, j * C + C / 2), k = j * cols + i;
        if (f <= 0) continue;
        const current = memUntil[k] > now ? memF[k] : 0;
        memF[k] = Math.max(current, f); memUntil[k] = until;
      }
    }

    function draw() {
      queued = false;
      if (!levels.length) return;
      // Where we are in the element, 0 at its top
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;   // off screen: skip the work
      const t = (-r.top / innerHeight) * o.drift * 3;
      const strength = Math.min(1, o.amount + energy * o.burst);
      ctx.imageSmoothingEnabled = false;
      const C = o.cell, n = levels.length, now = performance.now();
      for (let y = 0; y < H; y += C) {
        for (let x = 0; x < W; x += C) {
          // 0 = sharp, 1 = coarsest; blob field + noise, pushed up by strength
          let v = (field(x, y, t) * 0.5 + 0.5) * strength * 1.6 + (hash(x / C, y / C) - 0.5) * 0.25 * strength;
          const f = focusAt(x, y, now);
          v *= 1 - f;                                   // near the mouse: smaller blocks, sharp at the centre
          v = Math.min(Math.max(v, 0), 0.999);
          const L = levels[Math.floor(v * n)];
          // Occasionally pull the block from a neighbouring spot: the smeared, mis-copied look of a broken JPG
          const smear = strength > 0.5 && f < 0.3 && hash(y / C, x / C + Math.floor(t * 4)) > 0.93 ? C : 0;
          ctx.drawImage(L.c, (x + smear) / L.px, y / L.px, C / L.px, C / L.px, x, y, C, C);
        }
      }
    }

    function request() { if (!queued) { queued = true; if (energy < 0.01) lastT = performance.now(); requestAnimationFrame(tick); } }

    // Scrolling adds "energy" (faster scroll = more break-up), which then settles
    let lastT = performance.now();
    function tick() {
      const now = performance.now(), dt = Math.min((now - lastT) / 1000, 0.1); lastT = now;
      const dy = Math.abs(scrollY - lastY); lastY = scrollY;
      // fade evenly: from full break-up back to sharp in o.settle seconds
      energy = Math.min(1, Math.max(0, energy - dt / o.settle) + dy / 120);
      draw();
      if (energy > 0.01 && !calm) request();
      else if (energy) { energy = 0; draw(); }   // settle: one last frame at rest
    }

    /* ---- Twinkle: while the page is still, a few random patches
            flick into JPG blocks for a moment, then snap back ---- */
    let sparks = [], lum = null;
    // Brightness at a spot, read from the blockiest copy of the image (cheap)
    function bright(x, y) {
      const L = levels[levels.length - 1];
      if (!lum) { try { lum = L.c.getContext('2d').getImageData(0, 0, L.c.width, L.c.height); } catch (e) { return Math.random(); } }
      const i = (Math.min(L.c.height - 1, Math.floor(y / L.px)) * L.c.width + Math.min(L.c.width - 1, Math.floor(x / L.px))) * 4;
      return lum.data[i] + lum.data[i + 1] + lum.data[i + 2];
    }
    addEventListener('resize', () => { lum = null; });
    function patch(s, L) {   // draw one patch (a few cells) at a given pixel size
      ctx.imageSmoothingEnabled = false;
      const C = o.cell;
      for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) {
        const x = s.x + i * C, y = s.y + j * C;
        ctx.drawImage(L.c, (x + s.smear) / L.px, y / L.px, C / L.px, C / L.px, x, y, C, C);
      }
    }
    function twinkle() {
      if (!levels.length || energy > 0.01) { sparks = []; return; }   // scrolling takes over
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const now = performance.now(), C = o.cell;
      // Patches that have run their time snap back to sharp
      sparks = sparks.filter(s => { if (now > s.end) { patch(s, levels[0]); return false; } return true; });
      // New patches, on average o.twinkle per second
      if (Math.random() < o.twinkle / 10) {
        // Try a few spots and keep the brightest, so the lights are what twinkle
        let best = null;
        for (let k = 0; k < 8; k++) {
          const x = Math.floor(Math.random() * W / C) * C, y = Math.floor(Math.random() * H / C) * C;
          const b = bright(x, y);
          if (!best || b > best.b) best = { x, y, b };
        }
        if (focusAt(best.x, best.y, now) > 0.3) return;   // no twinkles where you're looking
        const s = {
          x: best.x,
          y: best.y,
          w: 1 + Math.floor(Math.random() * 3),           // 1–3 cells wide
          h: 1 + Math.floor(Math.random() * 2),           // 1–2 cells tall
          smear: Math.random() < 0.3 ? C : 0,             // sometimes copied from the wrong spot
          end: now + 150 + Math.random() * 600,           // lasts 0.15–0.75 s
        };
        const coarse = levels.slice(Math.floor(levels.length / 2));   // only the blockier sizes
        patch(s, coarse[Math.floor(Math.random() * coarse.length)]);
        sparks.push(s);
      }
    }
    o.twinkle = parseFloat(el.dataset.twinkle ?? 0);   // patches per second; 0 = off
    if (o.twinkle > 0 && !calm) setInterval(twinkle, 100);

    // Mouse: sharpen around it, remember where it has been, and clear the whole image as it moves
    if ((o.focus > 0 || o.clear > 0) && !calm) {
      addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        const nx = e.clientX - r.left, ny = e.clientY - r.top;
        if (o.clear > 0 && mouse.x > -9999) {
          energy = Math.max(0, energy - Math.hypot(nx - mouse.x, ny - mouse.y) / o.clear);
        }
        mouse.x = nx; mouse.y = ny;
        remember();
        if (energy > 0.01 || o.amount > 0) request();   // only redraw if there's pixelation to clear
      }, { passive: true });
      document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
      // If the image is broken up at rest, redraw as remembered spots expire
      setInterval(() => { if (o.amount > 0 && energy <= 0.01) request(); }, 120);
    }

    img.onload = build;
    addEventListener('resize', build);
    if (!calm) addEventListener('scroll', request, { passive: true });
  });
})();
