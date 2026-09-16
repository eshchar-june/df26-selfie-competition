# Artwork

## What's here

| file | what it is | used by |
|------|------------|---------|
| `hero-image.png` | Noah's Ark Waterpark, cut out on off-white | the hero |
| `image-1.png` … `image-3.png` | Booth selfies at the June wall | the three post samples |
| `image-4.png` | A fourth selfie, unused | — |
| `selfie-*.jpg`, `hero-image.jpg` | Compressed copies of the above | not currently referenced |

`build.js` embeds whatever the HTML references as a data URI and warns for anything
missing.

## Weight

The page references the compressed copies, and `dist/index.html` is **680 KB**.

Referencing the full-size PNGs instead makes it **10.6 MB**, and at that size the browser
leaves large areas unpainted while it decodes them. That was measured both ways, not
assumed.

PNG is a poor format for photographs: the originals are 1254px square at roughly 2 MB
each, shown in a 265px slot. The `.jpg` copies are the same pictures at 560px and about
75 KB.

To regenerate the compressed copies:

```bash
sips -s format jpeg -s formatOptions 86 -Z 820 hero-image.png --out hero-image.jpg
for n in 1 2 3 4; do
  sips -s format jpeg -s formatOptions 72 -Z 560 "selfie-$n.png" --out "selfie-$n.jpg"
done
```

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

## The hero photograph

`hero-image.jpg` is compressed from `hero-image.png` (kept out of git) the same way as
the selfies:

```bash
sips -s format jpeg -s formatOptions 86 -Z 820 hero-image.png --out hero-image.jpg
```

**Keep its off-white background.** It is the same colour as the page (`#faf9f5`), so the
cut-out seams into it invisibly. That also means no blend mode: multiplying two identical
off-whites would darken the ground into a visible block.

The hero never crops it. Both crops that were tried left a hard edge — through the sky
wash on the left, and through the foliage at the bottom — so the frame contains the whole
image, at the largest size that keeps it clear of the headline column.

Until the file is there, a drawn stand-in shows in its place. Both photo slots hide
themselves on error, so the page never shows a broken image.
