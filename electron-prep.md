=============
Alpha: Ready for constructed overlay
==============

- on first startup, the overlay isn't correctly sized (sometimes)

===============
Beta
===============

- settings
- validate that logged in user is premium / get their premium status
- BG overlay
    - Hero stats overlay
    - board highlight seems off
- update builder / overlay tech
- disk cache on overlay window
- notifications (component and service, which relies on OW)
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
