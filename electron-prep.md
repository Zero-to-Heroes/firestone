===============
Beta
===============

- overlay gets demultiplied

    Integrated mode is already off.
    Under Launch Options and Battlegrounds/General
    I start the Stand alone. I open Settings. Quest tracker icon shows up and works (in teh wrong place). I move it to a different location. Mouse over doesn't work. I close and reopen Settings, It work on mouse over. I move it again. Now I have 2 icons. Neither work. Close reopen Settings. I can get 3 icons. One of them works. I move the 3rd. none work... Not sure if this helps or makes you want more coffee....
    Note, the quest tracker icon take a bit to show up on a fresh launch.
    Upon repeating the above. I did nto get a second icon the first time I opened settings after the first. Then I could reliably repeat the above.
    Also, after I had 4 icons I went back and moved the second icon. When I closed and reopened Settings then it was the one the 5th icon was ontop of and working. Dragged that and it stopped working on mouse over as expected.

- custom installer (pending)
- validate that logged in user is premium / get their premium status (pending)

- BG overlay
    - Hero stats overlay
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
