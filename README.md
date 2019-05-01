[<img src="http://developers.overwolf.com/wp-content/uploads/2017/09/overwolf-appstore-badge.png">](https://www.overwolf.com/app/sebastien_tromp-hs_collection_companion)

# What is Firestone?

Firestone is an app you run on Overwolf alongside Hearthstone (like HearthArena).

It monitors the packs you open and tells you if the cards you receive are new cards or are just dust because you already have the maximum number of copies of the card. It also gives you an overview of how far along to completing each set you are, as well as details on cards (you can play the sounds they make in-game directly from the collection window).

It also adds in-game achievements to Hearthstone. It does a few things today:  
* Track the main achievements for the three rogue-like solo modes (Dungeon Run, Monster Hunt and Rumble Run). The achievements tracked today are:
    * Progress (how far you've gone with each class, or with which Shrine in case of RR)
    * Passive abilities played
    * Treasures played (DR and MH) / teammates recruited (RR)
    * Bosses faced and defeated (DR and MR) and shrines played (RR)
* When you complete an achievement, a short video replay is automatically saved on your hard drive (this can be disabled if you're worried about performances).

And it includes a Deck Tracker (still in an early phase).

Please don't hesitate to request new features or report issues using the issues link above.

# Features

* In-game notifications whenever you receive new or duplicate cards
* Pity timer for each set
* In-game collection manager
* See all the details of any cards (including the sounds it makes in game)
* Collect achievements in Dungeon Run, Monster Hunt and Rumble Run
* Record a short video clip whenever you unlock an achievement for the first time
* Integrated deck tracker
* App is accessible both from in-game and from desktop

# Screenshots

See the full [imgur album](https://imgur.com/a/hLz4ORp)

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

## Commit guidelines

The guidelines below are deprecated, I'm trying out some new stuff as I found out using the Angular guidelines didn't really build a commit history I was happy with.

Commits should be like `type(component): commit message`. Still figuring out exactly how to break up the types.

### Commit types

* feature: a new feature the user can interact with. The idea is that if we want to tell the users what's new, we just look at these commits
* tech: some new stuff that has no direct user value (like a new API)
* visual: changes in how things look like
* ux: changes in how the user interacts with the app
* refactor: technical changes that don't modify the behavior and don't add anything new
* perf: performance improvements
* log: add/remove logs
* release: stuff linked to releasing, like version bumps
* doc: add/update documentation (readme, code comments, etc.)

### Components

* coll: collection (binder) related stuff
* achv: achievements stuff
