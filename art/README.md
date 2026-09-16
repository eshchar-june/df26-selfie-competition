# Artwork

## What's here

| file | what it is | used by |
|------|------------|---------|
| `selfie-1.jpg` … `selfie-4.jpg` | Booth selfies at the June wall | the LinkedIn post preview |
| `waterpark.png` | **Missing.** Noah's Ark Waterpark, cut out on white | the hero |

`build.js` embeds whatever it finds here as a data URI and warns for anything missing, so
a build without the waterpark photo still succeeds — the hero falls back to drawn art.

## The selfies

The carousel cycles through them, so each caption preview looks like a different post.
Add a fifth by dropping in `selfie-5.jpg` and adding one more `<img class="shot">` to the
`.selfie` block in `index.html`; the rotation reads the count at runtime.

They are compressed from the ~2 MB originals (`image-*.png`, kept out of git) to 560 px
JPEGs, because the built page embeds them and four full-size PNGs would add about 10 MB
to a page designed to load instantly on conference wi-fi. To regenerate:

```bash
for n in 1 2 3 4; do
  sips -s format jpeg -s formatOptions 72 -Z 560 "image-$n.png" --out "selfie-$n.jpg"
done
```

## The waterpark photo

Still needed. Drop it in as `waterpark.png` — `.jpg`, `.webp` and `.gif` also work, but
change the `src` in `index.html` to match.

**Keep its white background.** The hero renders it with `mix-blend-mode: multiply`, which
drops that white into the cream page so the cut-out has no halo and the headline stays
readable where it crosses the sky.

The hero crops to a taller frame than a landscape source (`aspect-ratio` plus
`object-fit: cover` in `styles.css`), trimming the blank left margin so the art hangs low
enough to notch the pink prize card. If the crop sits wrong, adjust `object-position` on
`.waterpark` — currently `74% 50%`.

Until the file is there, a drawn stand-in shows in its place. Both photo slots hide
themselves on error, so the page never shows a broken image.
