/* Bundles the four source files into one self-contained page.
   Brand fonts are subset to woff2 and embedded, so the page has no network
   dependencies at all — it renders instantly on conference wi-fi, or offline.

   node build.js  →  dist/index.html        deploy this
                     dist/fragment.html     same page, minus the document shell
*/
const fs = require('fs');
const path = require('path');

const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');

/* CDN font file name (without the Webflow hash) → local subset */
const FONTS = {
  'IvoryLL-Light.otf':                 'IvoryLL-Light.woff2',
  'IvoryLL-LightItalic.ttf':           'IvoryLL-LightItalic.woff2',
  'IvoryLL-Regular.ttf':               'IvoryLL-Regular.woff2',
  'Sharp Sans Medium.woff':            'Sharp_Sans_Medium.woff2',
  'Sharp Sans Semibold.woff':          'Sharp_Sans_Semibold.woff2',
  'SharpSansBold.woff':                'SharpSansBold.woff2',
  'SharpEarthMono-Regular-Trial.otf':  'SharpEarthMono-Regular-Trial.woff2',
  'SharpEarthMono-Bold-Trial.otf':     'SharpEarthMono-Bold-Trial.woff2'
};

let css = read('styles.css');
let embedded = 0;

css = css.replace(
  /url\("https:\/\/cdn\.prod\.website-files\.com\/[^"]*?_([^"_\/]+?)"\)\s*format\("[a-z]+"\)/g,
  (whole, file) => {
    const local = FONTS[decodeURIComponent(file)];
    if (!local) { console.warn('  ! no subset for ' + file + ' — left on the CDN'); return whole; }
    const b64 = fs.readFileSync(path.join(__dirname, 'fonts', local)).toString('base64');
    embedded++;
    return 'url(data:font/woff2;base64,' + b64 + ') format("woff2")';
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

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
console.log('fonts embedded:      ' + embedded + '/' + Object.keys(FONTS).length);
console.log('dist/index.html:     ' + kb(page));
console.log('dist/fragment.html:  ' + kb(fragment));
