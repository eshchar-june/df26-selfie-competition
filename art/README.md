# Artwork

Two image files belong here. They are **not** in the repo — drop them in before building.
`build.js` embeds whatever it finds as a data URI, and warns loudly for anything missing:

```
! missing art/waterpark.png — left as a relative URL
```

| file             | what it is                                    | used by                    |
|------------------|-----------------------------------------------|----------------------------|
| `waterpark.png`  | Noah's Ark Waterpark, cut out on white        | the hero                   |
| `selfie.png`     | A visitor at the June booth wall              | the LinkedIn post preview  |

`.png`, `.jpg`, `.jpeg`, `.webp` and `.gif` all work — if you use a different extension,
change the `src` in `index.html` to match.

**The waterpark image must keep its white background.** The hero renders it with
`mix-blend-mode: multiply`, which drops that white into the cream page so the cut-out has
no halo and the headline stays readable where it crosses the sky. A pre-cut transparent
PNG works too, but the soft painterly edge is what makes it sit on the page nicely.

The hero crops the image to a taller frame than the source (`aspect-ratio` plus
`object-fit: cover` in `styles.css`), trimming the blank left margin so the art hangs low
enough to notch the pink prize card. If your crop sits wrong, adjust `object-position` on
`.waterpark` — it is currently `74% 50%`.
