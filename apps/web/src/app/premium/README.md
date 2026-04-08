# Premium page (`/premium`)

Marketing copy and optional **per-feature** screenshots for [www.firestoneapp.com/premium](https://www.firestoneapp.com/premium).

## Adding screenshots

Screenshots are **not** committed under `apps/web/src/assets`. They are served from the static CDN, same host as cards and i18n:

`https://static.firestoneapp.com/images/premium/`

### 1. Publish the image file

1. Export an optimized **WebP** (or add another format only if you also update the template to use `<picture>`).
2. Use a clear filename, e.g. `premium-arena-draft-overlay.webp`.
3. Upload the file to the `images/premium/` prefix on **static.firestoneapp.com** using your usual static-asset deploy process (see also [libs/shared/web-shell/README.md](../../../../../libs/shared/web-shell/README.md)).

Until the file exists at that URL, the page will show a broken image for that entry.

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
				src: premiumCdnImage('your-filename.webp'),
				alt: 'Short description of what the image shows for screen readers',
				caption: 'Optional line shown under the image',
			},
		],
	},
],
```

- **`src`**: Prefer `premiumCdnImage('filename.webp')` so everything stays under `PREMIUM_CDN_IMAGES_BASE`. You can use a full absolute URL instead if the asset lives elsewhere.
- **`alt`**: Required on each shot. Describe the UI, not “screenshot”.
- **`caption`**: Optional; rendered below the image inside a `<figure>`.

Multiple objects in **`screenshots`** stack under that feature only.

### 3. Cache busting

If you **replace** a file but keep the same name, browsers and the CDN may keep the old bytes. Either:

- Use a **new filename** (e.g. `premium-bgs-hero-v2.webp`) and update `src`, or  
- Append a query string, e.g. `premiumCdnImage('file.webp') + '?v=2'` (or bake `?v=` into a custom `src` string).

### 4. Layout and styling

Rendering is in [`premium-page.component.html`](./premium-page.component.html) (lazy-loaded `<img>` inside each feature row). Visual rules live in [`premium-page.global.scss`](./premium-page.global.scss) under `.feature-item-screenshots` and `.premium-screenshot`.

Thumbnails are wrapped in a **button**; clicking opens a **lightbox** that shows the same URL at **intrinsic resolution** (scrollable if the image is larger than the viewport). Close with the × control, **Escape**, or by clicking the dimmed backdrop. Logic is in [`premium-page.component.ts`](./premium-page.component.ts).
