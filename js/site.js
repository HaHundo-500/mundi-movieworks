/* =========================================================
   site.js — shared header, menu and footer for every page.
   Edit them HERE once, and every page updates.
   ========================================================= */

// ---- MENU: add, remove or reorder pages here ----
const MENU = [
  { href: 'index.html',    label: 'Home',     page: 'home' },
  { href: 'reel.html',     label: 'Reel',     page: 'reel' },
  { href: 'services.html', label: 'Services', page: 'services' },
  { href: 'credits.html',  label: 'Credits',  page: 'credits' },
  { href: 'about.html',    label: 'About',    page: 'about' },
  { href: 'contact.html',  label: 'Contact',  page: 'contact' },
];

const HEADER = `
  <a class="site-logo" href="index.html"><img class="site-logo-mark" src="media/logo/foolscap-mark.jpg" alt=""> Mundi Movieworks</a>
`;

const FOOTER = `
  <p>© 2026 Mundi Movieworks · Coburg, Melbourne · <a href="mailto:aidyn.m.films@gmail.com">aidyn.m.films@gmail.com</a></p>
`;

// ---- Build them (no need to edit below) ----
const current = document.body.dataset.page;

document.getElementById('site-header').innerHTML = HEADER;
document.getElementById('site-footer').innerHTML = FOOTER;
document.getElementById('site-nav').innerHTML =
  '<ul>' +
  MENU.map(item =>
    `<li><a href="${item.href}"${item.page === current ? ' aria-current="page"' : ''}>${item.label}</a></li>`
  ).join('') +
  '</ul>';
