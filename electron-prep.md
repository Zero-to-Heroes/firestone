TODO:

- BG overlay
    - Hero stats overlay
    - Simulator: web workers won't work in this context
    - Looking at the main process logs, there is a lag between the events and the game
        - logs reading? Or parsing? Or seralization from c# to electorn?
        - logs parsing seems ok, the log line about game end is not received so long after the game itself ends
        - so it's either because there is a bottleneck somewhere, or because the serialization is too costly with the node environment vs the cef
    - board highlight seems off
- restart game without restarting app should work
- update builder / overlay tech
- on first startup, the overlay isn't correctly sized
- login (to be able to gather stats, and see them in the non-standalone)
- settings
- legacy peer deps

- injector: make instantiation lazy
- notifications (component and service, which relies on OW)
- mercenaries widgets (move store to shared module, like game-state)
- lottery
- basically everything linked to the old store - remove it completely
- resize window
- all the rest (prefs, settings, main windows, etc)
- indexeddb service (in settings-root.component)
- load user-defined language in electron-setup, instead of the default one
