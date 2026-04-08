## Deploy / QA

- After `nx run web:deploy` for the `web` app, confirm the SPA route loads: [https://www.firestoneapp.com/premium](https://www.firestoneapp.com/premium) (same deep-link behavior as `/constructed`, `/battlegrounds/heroes`, etc.).
- Premium page marketing screenshots are **not** in the web deploy: upload WebP (or similar) to `https://static.firestoneapp.com/images/premium/` via the usual static CDN pipeline. Filenames must match those referenced in `apps/web/src/app/premium/premium-page.content.ts` (or bump `?v=` / rename when replacing an asset).

## TODO

- Sorting for heroes
- hero info: add a filigrane image (so both app + website)
- Since this will be deployed to firestoneapp.com, I need to also support the other standalone pages (like oog-login)
