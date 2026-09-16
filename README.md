# June · Dreamforce '26 LinkedIn post generator

A one-screen, mobile-first web app for the booth. A visitor taps **Generate my post**,
gets a ready-made LinkedIn draft on a June-branded card, edits it if they want, and taps
**Share** to hand it to the OS share sheet (LinkedIn included).

No framework, no dependencies, no backend.

```
index.html     markup
styles.css     June brand system (colours, type, card themes)
posts.js       the 39 ready-made drafts  ← edit copy here
app.js         generate / edit / share logic
fonts/         Ivoryll · Sharp Sans · Sharp Earth Mono, subset to woff2
build.js       bundles all of the above into one file
dist/          build output — this is what you deploy
```


## Before the show — one thing to change

`app.js`, line 8:

```js
var RULES_URL = 'https://june.ai/df26-rules';   // TODO: real official-rules page
```

That URL is a placeholder and currently 404s. Point it at the real eligibility and
official-rules page.

## Run it locally

```bash
node .claude/serve.js
```

Then open `http://localhost:4173`. Any static server works; so does opening
`index.html` straight from the filesystem.

## Build and deploy

```bash
node build.js
```

That inlines the CSS, the JS, and all eight brand font faces as data URIs, and writes
**`dist/index.html`** — a single 223 KB file with *zero* network requests. Deploy that
one file: Netlify Drop, Vercel, Cloudflare Pages, S3, anywhere. It renders instantly on
bad conference wi-fi and keeps working if the wi-fi drops entirely.

(`dist/fragment.html` is the same page without the document shell, for embedding. Ignore
it otherwise.)

Two notes:

- **Serve it over HTTPS.** The Web Share API and the clipboard both require a secure
  context. On plain `http://` (other than `localhost`) Share silently falls back.
- Put it on a short, typeable URL or a QR code at the booth — people will be one-handed
  with a coffee.

## How it behaves

**Generate new** draws from a shuffled queue, so a visitor sees all 39 drafts before any
repeats, and never the same one twice in a row. Each draft lands on one of six card
designs (yellow, pink, blue, sand, fog, ink), also never repeating back-to-back — so
"generate" visibly produces something new, not just new words.

**Share** calls `navigator.share({ text })`. On iOS and Android this opens the native
share sheet; picking LinkedIn prefills the composer with the draft. If the browser has no
Web Share API (most desktops), it copies the text to the clipboard and opens LinkedIn's
composer instead, and the status line says so.

**Editing** is live in the card. A character counter tracks LinkedIn's 3,000-character
limit and turns pink past it. Once someone edits, an **Undo edits** link appears, and
tapping **Generate new** asks for a second tap before it throws their writing away.

Nothing is persisted — no storage, no cookies, no analytics. A refresh gives the next
person a clean start, which is what you want on a shared booth device.

## Changing the copy

`posts.js` is a plain array:

```js
{ topic: "Watchlist", text: `…the post body…` }
```

`topic` is the short label on the card chip. `text` is the draft, newlines and all. Add,
remove, or reword freely — the app reads the array length at runtime.

## Fonts

Ivoryll, Sharp Sans, and Sharp Earth Mono are June's own faces, pulled from the june.ai
Webflow CDN and subset to Latin + typographic punctuation (143 KB across eight faces).

During development the source files reference the CDN directly, so you can edit and
reload without rebuilding. `build.js` swaps those URLs for the embedded subsets. Either
way the fallback is Arial, and the app stays entirely usable without them.

To refresh the subsets after a brand update:

```bash
python3 -m fontTools.subset <face> --flavor=woff2 --layout-features=kern,liga,calt \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0152-0153,U+2010-2027,U+2030-205E,U+20AC,U+2122,U+2190-2193,U+FB01-FB02" \
  --output-file=fonts/<face>.woff2
```
