[<img src="https://user-images.githubusercontent.com/43519401/188874356-9a7dd2d1-af15-4d82-8fd7-40c4f1a69259.png" width="166px" height="49px"> ](https://www.overwolf.com/app/Sebastien_Tromp-Firestone)

# What is Firestone?

Firestone is an app you run on Overwolf alongside Hearthstone (like HearthArena).

See the main [imgur album](https://imgur.com/a/hLz4ORp)
And [the screenshots](https://imgur.com/a/9mYoN05) for battlegrounds personal stats are

# Contributing

- first you need to install Firestone from the official Overwolf store (see https://www.firestoneapp.com for the download link)
- the main folder is `core`, and everything happens there.
- run `npm install`, then you manually have to go to `node_modules` and remove the `.ts` files from inside the `angular2-indexeddb` package. You only to do this the first time you run the install
- build with `npm run dev`
- then right click on the Overwolf icon in the system tray, then Settings, About, and Developer options. It will show the Overwolf's Package Manager from where you can load and refresh apps.
- click on Load Unpacked extension, and point it to your `core/dist` folder

Other things to note:

- You can enable Chrome dev tools to get access to the console, see https://overwolf.github.io/docs/topics/enable-dev-tools#how-to-enable-dev-tools

## Submitting PRs

- Make sure you test all your changes locally first
- If you're proposing UI changes, please post a screenshot of what the app looks like before the change, and after your change
- Keep the PRs as small as possible. Following the previous rule, you should be able to take a single screenshot that showcases all the changes at once. If not possible, this probably means the PR should be split

# Links

- The app can be downloaded from here: https://www.overwolf.com/app/sebastien_tromp-firestone
- If you want to come and say hi on Discord: https://discord.gg/uEh9gvJ
- Stay up-to-date with what we're doing and bugs found on Twitter: https://twitter.com/ZerotoHeroes_HS
- An imgur album with more screenshots: https://imgur.com/a/hLz4ORp
