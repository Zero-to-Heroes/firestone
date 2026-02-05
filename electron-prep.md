===============
Beta
===============

- custom installer (pending)
- validate that logged in user is premium / get their premium status (pending)

- BG overlay
    - board highlight seems off
- disk cache on overlay window
- notifications (component and service, which relies on OW)
    - [2026-02-03 11:23:55.118] [ERROR] Cannot inject to elevated game - app is not elevated
- mercenaries widgets (move store to shared module, like game-state)
- basically everything linked to the old store - remove it completely
- resize window
- all the rest (prefs, settings, main windows, etc)
- indexeddb service (in settings-root.component)

====================
Final release
===================

- load user-defined language in electron-setup, instead of the default one
- injector: make instantiation lazy
- other account providers (Google, Battle.net, WeChat)
