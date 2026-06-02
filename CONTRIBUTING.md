# Contributing

## Requirements

-   node 18

## Building and installing

-   first you need to install Firestone from the official Overwolf store (see https://www.firestoneapp.com for the download link), as it won't let you load a dev version if the official version hasn't been installed first
-   run `npm install`.
-   build with `npm run dev`
-   once it's built, open a new shell, and run `npm run replace-version` (if you know how to integrate that directly in the `npm run dev` task, please let me know!)

## App version

Both the Overwolf and Electron apps use the `"version"` field in the root [package.json](package.json) as the single source of truth. Bump that field when releasing either app.

-   **Overwolf**: `npm run build` runs `replace-version` automatically (substitutes `@app-version@` in the built manifest).
-   **Electron**: `npm run full-build:ow-electron` or `full-publish:ow-electron` runs `replace-version` after `nx build electron-app` (substitutes `@app-version@` in `dist/apps/electron-app/package.json`). Local dev scripts such as `restart:ow-electron` also run it after the electron-app build.
-   then right click on the Overwolf icon in the system tray, then Settings, About, and Developer options. It will show the Overwolf's Package Manager from where you can load and refresh apps.
-   click on Load Unpacked extension, and point it to your `dist/apps/legacy` folder

## Other things to note:

-   You can enable Chrome dev tools to get access to the console, see https://overwolf.github.io/docs/topics/enable-dev-tools#how-to-enable-dev-tools

## Submitting PRs

-   Make sure you test all your changes locally first
-   If you're proposing UI changes, please post a screenshot of what the app looks like before the change, and after your change
-   Keep the PRs as small as possible. Following the previous rule, you should be able to take a single screenshot that showcases all the changes at once. If not possible, this probably means the PR should be split
