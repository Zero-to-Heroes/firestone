[<img src="http://developers.overwolf.com/wp-content/uploads/2017/09/overwolf-appstore-badge.png">](https://www.overwolf.com/app/sebastien_tromp-hs_collection_companion)

# What is Firestone?

Firestone is an app you run on Overwolf alongside Hearthstone (like HearthArena).

It monitors the packs you open and tells you if the cards you receive are new cards or are just dust because you already have the maximum number of copies of the card. It also gives you an overview of how far along to completing each set you are, as well as details on cards (you can play the sounds they make in-game directly from the collection window);

The long-term goal is to provide other features needed by players who want to manage their collection (such as stats, missing cards, etc.), as well as an achievements system and deck tracker.

Please don't hesitate to request new features or report issues using the issues link above.

PS: images come from HearthHead

# Screenshots

![Welcome page](https://i.imgur.com/vrRhtLj.png)

![In-game notifications](https://i.imgur.com/nCpwKGq.png)

![Collection overview](https://i.imgur.com/Pr416nZ.png)

![Card details](https://i.imgur.com/p2TgqZe.png)

# Contributing

```
$ git clone ...
$ cd your_repo
$ cd Files
$ npm install  # You might need to have node installed
# Then go into node_modules/angular2-indexeddb and remove all the .ts files (there are 4-5 of them)
# Clone ZeroToHeroes/ng-select and install this version locally and copy it to node_modules (hopefully not for long)
# Same for ZeroToHeroes/angular2-notifications and install this version locally and copy it to node_modules (hopefully not for long)
$ npm run dev # For development
$ npm run build # For release
```
