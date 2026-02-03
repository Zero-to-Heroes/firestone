=============
Alpha: Ready for constructed overlay
==============

===============
Beta
===============

- settings
    - import/export settings
    - reload windows after changing the "overlay" mode
- custom installer
- validate that logged in user is premium / get their premium status
- Installer link should always point to the latest version
- [2026-02-03 11:23:55.118] [ERROR] Cannot inject to elevated game - app is not elevated

- BG overlay
    - Hero stats overlay
    - board highlight seems off
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
