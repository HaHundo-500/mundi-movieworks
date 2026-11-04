/* =========================================================
   scenes.js — (not built yet)

   Plan: each <figure data-scene> holds stacked layers.
   When the scene scrolls into view, layers materialise in
   order of data-order: background shifts into frame first,
   the foreground (e.g. a character) stays at 0 opacity until
   the layers behind it have settled.

   Hook in the HTML:
     <figure class="scene" data-scene>
       <video class="layer" data-layer="background" data-order="1" ...></video>
       <video class="layer" data-layer="foreground" data-order="3" ...></video>
     </figure>
   ========================================================= */
