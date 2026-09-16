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


const src = read('index.html');
const title = /<title>([\s\S]*?)<\/title>/.exec(src)[1];
const body  = /<body>([\s\S]*?)<\/body>/.exec(src)[1]
  .replace(/\n\s*<script src="[^"]+"><\/script>/g, '')
  .trim();

const fragment = [
  '<title>' + title + '</title>',
  '<style>\n' + css + '\n</style>',
  body,
  '<script>\n' + read('posts.js') + '\n</script>',
  '<script>\n' + read('app.js') + '\n</script>'
].join('\n\n');

/* Everything from the source <head> except the stylesheet link. */
const head = /<head>([\s\S]*?)<\/head>/.exec(src)[1]
  .replace(/\n\s*<title>[\s\S]*?<\/title>/, '')
  .replace(/\n\s*<link rel="stylesheet"[^>]*>/, '')
  .trim();

const page = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' + head +
  '\n<title>' + title + '</title>\n<style>\n' + css + '\n</style>\n</head>\n<body>\n' +
  body + '\n\n<script>\n' + read('posts.js') + '\n</script>\n<script>\n' + read('app.js') +
  '\n</script>\n</body>\n</html>\n';

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), page);
fs.writeFileSync(path.join(__dirname, 'dist/fragment.html'), fragment);

const faces = (read('styles.css').match(/@font-face/g) || []).length;
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
console.log('fonts embedded:      ' + embedded + '/' + faces);
console.log('dist/index.html:     ' + kb(page));
console.log('dist/fragment.html:  ' + kb(fragment));
