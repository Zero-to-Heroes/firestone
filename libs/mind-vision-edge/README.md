# MindVision Edge.js Integration

This library provides Electron/Node.js integration with the OverwolfUnitySpy.dll plugin used for Hearthstone memory reading.

## Overview

The MindVision plugin allows reading Hearthstone's memory to get information about the current game state, including:

- Current scene (menu, game, etc.)
- Memory changes and updates
- Bootstrap status
- And more...

## Usage

```javascript
const MindVisionEdge = require('./libs/mind-vision-edge');

const mindVision = new MindVisionEdge();

// Initialize the plugin
await mindVision.initialize();

// Get current scene
const scene = await mindVision.getCurrentScene();
console.log('Current scene:', scene); // e.g., "HUB", "GAMEPLAY", etc.

// Check if bootstrapped
const bootstrapped = await mindVision.isBootstrapped();
console.log('Is bootstrapped:', bootstrapped);

// Get memory changes
const changes = await mindVision.getMemoryChanges();
console.log('Memory changes:', changes);
```

## Requirements

- Node.js with Edge.js support
- OverwolfUnitySpy.dll in the `overwolf-plugins/` directory
- Hearthstone running for memory reading functionality

## Implementation Details

This implementation:

- Uses Edge.js to bridge Node.js and C# code
- Properly initializes the plugin's event handlers (`onGlobalEvent`, `onMemoryUpdate`)
- Uses direct MindVision calls to bypass callback issues in `callUnitySpy`
- Maintains the same API as the original Overwolf plugin for compatibility

## API Methods

- `initialize()` - Initialize the plugin and set up event handlers
- `getCurrentScene()` - Get the current Hearthstone scene
- `isBootstrapped()` - Check if the plugin is bootstrapped
- `getMemoryChanges()` - Get recent memory changes
- `listenForUpdates()` - Start listening for memory updates
- `isInitialized()` - Check if the plugin is initialized
