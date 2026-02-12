===============
Beta
===============

- logging:
    - don't serialize debug logs from the frontend
- custom installer (pending)
- validate that logged in user is premium / get their premium status (pending)
    - udpate welcome notification accordingly

- main window
    - be able to subscribe to a new plan or manage existing plans
- mercenaries widgets (move store to shared module, like game-state)
- basically everything linked to the old store - remove it completely
- resize window
- ow-utils
- all the rest (prefs, settings, main windows, etc)
- indexeddb service (in settings-root.component)
- hotkeys (bg tab, bg window, main window)
- disk cache on overlay window

====================
Final release
===================

- load user-defined language in electron-setup, instead of the default one
- injector: make instantiation lazy
- other account providers (Google, Battle.net, WeChat)
