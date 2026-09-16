/* Bundles the source files into one self-contained page.
   Fonts are subset to woff2 and embedded, so the page has no network
   dependencies at all — it renders instantly on conference wi-fi, or offline.

   node build.js  →  dist/index.html        deploy this
                     dist/fragment.html     same page, minus the document shell
*/
const fs = require('fs');
const path = require('path');

const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const dataUri = (local) =>
  'url(data:font/woff2;base64,' +
  fs.readFileSync(path.join(__dirname, 'fonts', local)).toString('base64') +
  ') format("woff2")';

/* CDN font file name (without the Webflow hash) → local subset */
const FONTS = {
  'Sharp Sans Medium.woff':   'Sharp_Sans_Medium.woff2',
  'Sharp Sans Semibold.woff': 'Sharp_Sans_Semibold.woff2',
  'SharpSansBold.woff':       'SharpSansBold.woff2'
};

let css = read('styles.css');
let embedded = 0;

/* 1 — June's brand faces, referenced from the Webflow CDN during development. */
css = css.replace(
  /url\("https:\/\/cdn\.prod\.website-files\.com\/[^"]*?_([^"_\/]+?)"\)\s*format\("[a-z]+"\)/g,
  (whole, file) => {
    const local = FONTS[decodeURIComponent(file)];
    if (!local) { console.warn('  ! no subset for ' + file + ' — left on the CDN'); return whole; }
    embedded++;
    return dataUri(local);
  }
);

/* 2 — Faces already served from fonts/ (Caveat, for the marker annotations). */
css = css.replace(
  /url\("fonts\/([^"]+\.woff2)"\)\s*format\("woff2"\)/g,
  (whole, local) => {
    if (!fs.existsSync(path.join(__dirname, 'fonts', local))) {
      console.warn('  ! missing fonts/' + local + ' — left as a relative URL'); return whole;
    }
    embedded++;
    return dataUri(local);
  }
);


/* 3 — artwork referenced from art/, embedded so the page needs no network. */
const MIME = { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp', gif:'image/gif' };
let images = 0, missing = 0;

function inlineArt(html) {
  return html.replace(/src="(art\/[^"]+)"/g, (whole, rel) => {
    const file = path.join(__dirname, rel);
    if (!fs.existsSync(file)) {
      missing++;
      console.warn('  ! missing ' + rel + ' — left as a relative URL');
      return whole;
    }
    const ext = path.extname(file).slice(1).toLowerCase();
    const mime = MIME[ext];
    if (!mime) { console.warn('  ! unknown image type for ' + rel); return whole; }
    images++;
    return 'src="data:' + mime + ';base64,' +
           fs.readFileSync(file).toString('base64') + '"';
  });
}

const PAGES = fs.readdirSync(__dirname).filter((f) => f.endsWith('.html'));

function buildPage(file) {
  const src = read(file);
  const title = /<title>([\s\S]*?)<\/title>/.exec(src)[1];
  const body = /<body>([\s\S]*?)<\/body>/.exec(src)[1]
    .replace(/\n\s*<script src="[^"]+"><\/script>/g, '')
    .trim();
  const bodyArt = inlineArt(body);

  /* the page's own scripts, in source order */
  const scripts = (src.match(/<script src="([^"]+)"><\/script>/g) || [])
    .map((t) => /src="([^"]+)"/.exec(t)[1])
    .map((f) => '<script>\n' + read(f) + '\n</script>')
    .join('\n');

  /* everything from the source <head> except the stylesheet link */
  const headHtml = /<head>([\s\S]*?)<\/head>/.exec(src)[1]
    .replace(/\n\s*<title>[\s\S]*?<\/title>/, '')
    .replace(/\n\s*<link rel="stylesheet"[^>]*>/, '')
    .trim();

  const page = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' + headHtml +
    '\n<title>' + title + '</title>\n<style>\n' + css + '\n</style>\n</head>\n<body>\n' +
    bodyArt + '\n\n' + scripts + '\n</body>\n</html>\n';

  const fragment = [
    '<title>' + title + '</title>',
    '<style>\n' + css + '\n</style>',
    bodyArt,
    scripts
  ].join('\n\n');

  return { page, fragment };
}

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
const faces = (read('styles.css').match(/@font-face/g) || []).length;
const sizes = [];

for (const file of PAGES) {
  const { page, fragment } = buildPage(file);
  fs.writeFileSync(path.join(__dirname, 'dist', file), page);
  sizes.push(['dist/' + file, kb(page)]);
  if (file === 'index.html') {
    fs.writeFileSync(path.join(__dirname, 'dist/fragment.html'), fragment);
    sizes.push(['dist/fragment.html', kb(fragment)]);
  }
}

console.log('fonts embedded:      ' + embedded + '/' + faces);
console.log('images embedded:     ' + images + (missing ? '  (' + missing + ' MISSING)' : ''));
for (const [name, size] of sizes) console.log(name.padEnd(21) + size);
