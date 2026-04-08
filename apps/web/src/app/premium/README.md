# Premium page (`/premium`)

Marketing copy and optional **per-feature** screenshots for [www.firestoneapp.com/premium](https://www.firestoneapp.com/premium).

## Adding screenshots

Screenshots are **not** committed under `apps/web/src/assets`. They are served from the static CDN, same host as cards and i18n:

`https://static.firestoneapp.com/premium/`

### 1. Publish the image files

For each screenshot you usually want **two** WebP assets so the overview stays light and the lightbox stays sharp:

1. **Preview (inline)** — smaller dimensions and/or stronger compression; shown in the feature list. Name it clearly, e.g. `premium-arena-draft-overlay-thumb.webp`.
2. **Full (lightbox)** — full resolution; loaded only when the user opens the lightbox.

You can start with a single full-size file and wire only `fullSrc` (omit `thumbSrc`) until a preview exists; the page will use the full URL for both until you add `thumbSrc`.

Upload both under the `premium/` prefix on **static.firestoneapp.com** using your usual static-asset deploy process (see also [libs/shared/web-shell/README.md](../../../../../libs/shared/web-shell/README.md)).

Until a file exists at the URL you reference, the page will show a broken image for that entry.

### 2. Wire it in content

Edit [`premium-page.content.ts`](./premium-page.content.ts).

1. Find the right object in `premiumSections` (match `id`: `battlegrounds`, `constructed`, `arena`, `collection`, `general`).
2. Each **`items`** entry is a **`PremiumFeatureItem`**: `{ text: string, screenshots?: ... }`. Plain bullets use only `text`.
3. To attach one or more images to **that specific feature**, add **`screenshots`** on the same object:

```ts
items: [
	{ text: 'Short feature description' },
	{
		text: 'Another feature — this one has a visual',
		screenshots: [
			{
				thumbSrc: premiumCdnImage('your-filename-thumb.webp'),
				fullSrc: premiumCdnImage('your-filename.webp'),
				alt: 'Short description of what the image shows for screen readers',
				caption: 'Optional line shown under the image',
			},
		],
	},
],
```

- **`fullSrc`**: Full-size image for the lightbox (loaded on click). Prefer `premiumCdnImage('filename.webp')` so everything stays under `PREMIUM_CDN_IMAGES_BASE`. You can use a full absolute URL instead if the asset lives elsewhere.
- **`thumbSrc`**: Optional. Inline preview to save bandwidth; omit to use `fullSrc` for both until a preview asset exists.
- **`alt`**: Required on each shot. Describe the UI, not “screenshot”.
- **`caption`**: Optional; rendered below the image inside a `<figure>`.

Multiple objects in **`screenshots`** stack under that feature only.

### 3. Cache busting

If you **replace** a file but keep the same name, browsers and the CDN may keep the old bytes. Either:

- Use a **new filename** (e.g. `premium-bgs-hero-v2.webp`) and update `fullSrc` / `thumbSrc`, or  
- Append a query string, e.g. `premiumCdnImage('file.webp') + '?v=2'` (or bake `?v=` into a custom URL string).

### 4. Layout and styling

Rendering is in [`premium-page.component.html`](./premium-page.component.html) (lazy-loaded `<img>` inside each feature row). Visual rules live in [`premium-page.global.scss`](./premium-page.global.scss) under `.feature-item-screenshots` and `.premium-screenshot`.

Thumbnails are wrapped in a **button**; clicking opens a **lightbox** that loads **`fullSrc`** and scales it to fit the viewport at most. Close with the × control, **Escape**, or by clicking the dimmed backdrop. Logic is in [`premium-page.component.ts`](./premium-page.component.ts).
