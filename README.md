# June · Dreamforce 26 selfie competition

A one-screen, mobile-first web app for the booth. A visitor takes a selfie at the June
wall, picks a ready-made LinkedIn caption, edits it if they want, copies it or hands it
to the OS share sheet, and posts — which enters them in the raffle.

No framework, no dependencies, no backend, no sign-up. Anyone with the link can use it.

```
index.html     markup + the placeholder artwork (inline SVG)
styles.css     brand system — navy / coral / cream, type, card styles
posts.js       the 39 ready-made captions  ← edit copy here
app.js         carousel / edit / copy / share logic
fonts/         Sharp Sans (June) · Caveat (marker annotation), subset to woff2
build.js       bundles all of the above into one file
dist/          build output — this is what you deploy
```

## Before the show — two things to change

**1. The rules URL.** `app.js`, line 7:

```js
var RULES_URL = 'https://june.ai/dreamforce';   // TODO: real eligibility / official rules
```

This is the link behind "june.ai/dreamforce" in the raffle banner. For a prize
promotion it needs to point at the real eligibility and official-rules page.

**2. The placeholder artwork.** Two images in `index.html` are stand-ins, each marked
with a `PLACEHOLDER ART` comment:

- **The waterpark** — a drawn SVG standing in for the licensed Noah's Ark photograph.
  Replace the whole `<svg class="waterpark">` with `<img src="art/waterpark.jpg" alt="Noah's Ark Waterpark">`.
- **The selfie preview** — a grey silhouette on June's repeating wordmark backdrop. It
  only previews what the visitor's post will look like, so a real photo is optional.

## Run it locally

```bash
node .claude/serve.js
```

Then open `http://localhost:4173`. Any static server works.

## Build and deploy

```bash
node build.js
```

That inlines the CSS, the JS, and all four font faces as data URIs, and writes
**`dist/index.html`** — a single 120 KB file with *zero* network requests. Deploy that
one file anywhere: Vercel, Netlify Drop, Cloudflare Pages, S3. It renders instantly on
bad conference wi-fi and keeps working if the wi-fi drops entirely.

`vercel.json` is already wired up (`node build.js` → `dist`), so importing the repo into
Vercel needs no further configuration.

Two notes:

- **Serve it over HTTPS.** The Web Share API and the clipboard both require a secure
  context. On plain `http://` (other than `localhost`) sharing falls back to copying.
- Put it on a short, typeable URL or a QR code at the booth — people will be one-handed
  with a coffee.

## How it behaves

**The carousel** steps through all 39 captions with the arrows. The counter reads
`n / 39` and the five dots below it are a window onto the position, so they stay
readable across the whole set.

**Copy text** puts the caption on the clipboard.

**Open LinkedIn** calls `navigator.share({ text })`, so on iOS and Android it opens the
native share sheet and picking LinkedIn prefills the composer. Where there is no Web
Share API (most desktops), it copies the caption and opens LinkedIn's composer instead,
so the text is always in hand.

**Editing** is live in the caption card. Once someone edits, an **Undo edits** link
appears, and tapping an arrow asks for a second tap before it throws their writing away.

Each visitor lands on a random caption, so a queue at the booth doesn't all post the
same thing. Nothing is persisted — no storage, no cookies, no analytics. A refresh gives
the next person a clean start.

## Changing the copy

`posts.js` is a plain array:

```js
{ topic: "Watchlist", text: `…the caption body…` }
```

`text` is the caption, newlines and all. Add, remove, or reword freely — the app reads
the array length at runtime, and the counter and dots follow it.

## Fonts

Sharp Sans is June's own face, pulled from the june.ai Webflow CDN and subset to Latin
plus typographic punctuation. Caveat (SIL Open Font License) supplies the handwritten
"Bigger splashes together." annotation, subset to just the glyphs that phrase uses.

During development the source files reference the CDN directly, so you can edit and
reload without rebuilding. `build.js` swaps those URLs for the embedded subsets. Either
way the fallback is Arial, and the app stays entirely usable without them.

To refresh the Sharp Sans subsets after a brand update:

```bash
python3 -m fontTools.subset <face> --flavor=woff2 --layout-features=kern,liga,calt \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0152-0153,U+2010-2027,U+2030-205E,U+20AC,U+2122,U+2190-2193,U+FB01-FB02" \
  --output-file=fonts/<face>.woff2
```
