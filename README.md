# June · Dreamforce 26 selfie competition

A one-screen, mobile-first web app for the booth. A visitor takes a selfie at the June
wall, picks a ready-made LinkedIn caption, edits it if they want, copies it or hands it
to the OS share sheet, and posts — which enters them in the raffle.

No framework, no dependencies, no backend, no sign-up. Anyone with the link can use it.

```
index.html     markup for the live page
playground.html  /playground — How-to-join design variations
styles.css     brand system — navy / coral / cream, type, card styles
posts.js       the 39 ready-made captions  ← edit copy here
app.js         carousel / edit / copy / share logic
fonts/         Sharp Sans (June) · Caveat (marker annotation), subset to woff2
art/           waterpark + selfie photographs (not in the repo — see art/README.md)
build.js       bundles every .html page into one self-contained file each
dist/          build output — this is what you deploy
```

## Before the show — two things to change

**1. The rules URL.** `app.js`, line 7:

```js
var RULES_URL = 'https://june.ai/dreamforce';   // TODO: real eligibility / official rules
```

This is the link behind "june.ai/dreamforce" in the raffle banner. For a prize
promotion it needs to point at the real eligibility and official-rules page.

**2. The artwork.** Two photographs are referenced but not committed — see
[`art/README.md`](art/README.md):

- `art/waterpark.png` — Noah's Ark Waterpark, for the hero. Keep its white background;
  the hero uses `mix-blend-mode: multiply` so that white dissolves into the cream page.
- `art/selfie.png` — a visitor at the June booth wall, for the LinkedIn post preview.

`build.js` embeds whatever it finds and warns for anything missing, so a build without
them still succeeds — the page just shows broken images.

## Run it locally

```bash
node .claude/serve.js
```

Then open `http://localhost:4173`. Any static server works.

## Build and deploy

```bash
node build.js
```

That inlines the CSS, the JS, the font faces and the photographs as data URIs, and
writes one self-contained file per page into `dist/` — `index.html` and
`playground.html`, each with *zero* network requests. Deploy the folder anywhere:
Vercel, Netlify Drop, Cloudflare Pages, S3. It renders instantly on bad conference
wi-fi and keeps working if the wi-fi drops entirely.

With `cleanUrls` on (already set in `vercel.json`), the variations page is served at
**`/playground`**.

`vercel.json` is already wired up (`node build.js` → `dist`), so importing the repo into
Vercel needs no further configuration.

Two notes:

- **Serve it over HTTPS.** The Web Share API and the clipboard both require a secure
  context. On plain `http://` (other than `localhost`) sharing falls back to copying.
- Put it on a short, typeable URL or a QR code at the booth — people will be one-handed
  with a coffee.

## How it behaves

**The post preview** shows the caption the way the feed will: clipped at a word
boundary with a "see more", and the hashtags below it in LinkedIn blue. It follows
the carousel and updates live as the caption is edited.

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
