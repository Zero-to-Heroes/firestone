## Goal

Create a new electron app that reuses as much code as possible from the existing Overwolf desktop app. It should use the ow-electron package for overlay injection and ads

## Description

The current repo is about an app for the video game Hearthstone. It is built for the Overwolf platform, which uses the CEF from Chrome, using NX and Angular.
I want to build a standalone application, that doesn't require the user to install Overwolf. The current idea is to build it for electron, which ideally would let me reuse code.
However, from my understanding, Overwolf and electron differ quite a lot on a few points:

- In Overwolf, all windows share the same thread, which lets me share variables between windows. Even the "background controller" in Overwolf is a standard web page. In electron however, there is the concept of a controller running NodeJS, and renderers. They can't share variables or instances, and need to communicate using serialization.
- Overwolf lets me inject code in a game, which is not natively supported in electron. The ow-electron package, however, should be able to do this.
- I also need to use C# plugins for low-level stuff. Overwolf lets me do this, and I would need to find a way to do it in electron as well

## Questions

- What do you think of the idea?
- Does it look feasible? What will be the main challenges?
- How do you propose I approach this?
