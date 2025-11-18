## Goal

Create a new electron app that reuses as much code as possible from the existing Overwolf desktop app. It should use the ow-electron package for overlay injection and ads. I shouldn't replace the existing Overwolf app, but exist alongside it.

## Description

The current repo is about an app for the video game Hearthstone. It is built for the Overwolf platform, which uses the CEF from Chrome, using NX and Angular.
I want to build a standalone application, that doesn't require the user to install Overwolf. The current idea is to build it for electron, which ideally would let me reuse code.
However, from my understanding, Overwolf and electron differ quite a lot on a few points:

- In Overwolf, all windows share the same thread, which lets me share variables between windows. Even the "background controller" in Overwolf is a standard web page. In electron however, there is the concept of a controller running NodeJS, and renderers. They can't share variables or instances, and need to communicate using serialization.
- Overwolf lets me inject code in a game, which is not natively supported in electron. The ow-electron package, however, should be able to do this.
- I also need to use C# plugins for low-level stuff. Overwolf lets me do this, and I would need to find a way to do it in electron as well

## Priorities

- Having a deck tracker overlay working

## Next steps

- Make GameStatusService available in both contexts
    - in electron, delegate to a pure electron service, as the current implementation relies strongly on Overwolf
    - So we need to have the service in the electron lib, and have gameStatusService delegate to that status when we're in an electron context
    - facade pattern
        - expose the main service in the "main" process, which is outside of Angular, and serialize the data between it and the renderer process
    - dependency injection
        - AppInjector could be made generic to work in both contexts?

Notes:

- don't recreate an electron-overwolf service. The goal will probably be to have various services get their share of the work of the current Overwolf service.

### Later

- Make SceneService fully available and functional, both within the NodeJS environment and in a renderer (for decktracker-ooc component)
    - MindVision needs to remove its dependency on OverwolfService (only gameStatus?)
    - MindVisionFacade looks a lot like the mind-vision-electron service, so maybe use a common interface?
    - StateMachine needs to remove the dependency on OW service (only gameStatus?). Also GlobalError, but maybe we can comment that out for now
    - memoryUpdate needs to be fed memory updates (from the mind-vision-electron service?)
    - dependency injection
        - AppInjector could be made generic to work in both contexts?
    - facade pattern
        - expose the main service in the "main" process, which is outside of Angular, and serialize the data between it and the renderer process

TODO now:

- add other widgets
