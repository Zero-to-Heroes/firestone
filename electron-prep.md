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

- Done: basic Hello World overlay injection
- Done: integrating C# plugins from electron (MindVision memory reading)
- Next steps: add a decktracker overlay

To do this, we will need:

- Start thinking about code sharing between the Overwolf app and the electron app (including dependency injection). Ideally, share as much code as possible with the Overwolf app. Notably game-status.service, log-register.service, game-events.service, etc.
    - Decide which services need to be abstracted with different implementations for electron vs Overwolf, and which ones could be reused directly
- Integrate log parsing C# plugin
- To have a fullscreen overlay window that reuses the \_fullscreen-overlays Angular component
- To communicate between the main window and the overlay window. Today, this is done in various places, but looking at \_full-screen-overlays.component and decktracker-player-widget-wrapper.component should give a good idea of the most useful services to have
