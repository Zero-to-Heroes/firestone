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
- electron-edge-js package (included in project dependencies)

## Building

After making changes to the C# code or when setting up the project for the first time, you need to rebuild the native modules:

```bash
# Simple build command
npm run build:mindvision

# Alternative: individual steps
npm run build:mindvision:rebuild  # Rebuild native modules
npm run build:mindvision:copy     # Copy files to dist

# Clean build (if you encounter issues)
npm run build:mindvision:clean
```

The build process:

1. Rebuilds electron-edge-js native modules for the current Electron version
2. Copies all MindVision files to the dist directory
3. Verifies that all required files are present

## Implementation Details

This implementation:

- Uses Edge.js to bridge Node.js and C# code
- Properly initializes the plugin's event handlers (`onGlobalEvent`, `onMemoryUpdate`)
- Uses direct MindVision calls to bypass callback issues in `callUnitySpy`
- Maintains the same API as the original Overwolf plugin for compatibility

## API Methods

### Core Plugin Methods

- `initialize()` - Initialize the plugin and set up event handlers
- `getCurrentScene()` - Get the current Hearthstone scene
- `isBootstrapped()` - Check if the plugin is bootstrapped
- `getMemoryChanges()` - Get recent memory changes
- `listenForUpdates()` - Start listening for memory updates
- `startListeningWithCallback(callback)` - Start listening for memory updates with real-time callback
- `isInitialized()` - Check if the plugin is initialized

### Collection Methods

- `getCollection(throwException?, debug?)` - Get the player's card collection
- `getCollectionSize(throwException?, debug?)` - Get the size of the player's collection
- `getBattlegroundsOwnedHeroSkinDbfIds()` - Get owned Battlegrounds hero skin IDs
- `getCardBacks()` - Get available card backs
- `getCoins()` - Get coin information

### Match and Game State Methods

- `getMatchInfo()` - Get current match information
- `getCurrentBoard()` - Get the current board state
- `getGameUniqueId()` - Get unique identifier for the current game
- `getRegion()` - Get the current Battle.net region

### Battlegrounds Methods

- `getBgsPlayerTeammateBoard()` - Get teammate's board in Battlegrounds
- `getBgsPlayerBoard()` - Get player's board in Battlegrounds
- `getBattlegroundsInfo(forceReset?)` - Get Battlegrounds rating and info
- `getBattlegroundsSelectedMode(forceReset?)` - Get selected Battlegrounds mode (solo/duos)

### Mercenaries Methods

- `getMercenariesInfo(forceReset?)` - Get Mercenaries game mode information
- `getMercenariesCollectionInfo(forceReset?)` - Get Mercenaries collection data

### Arena Methods

- `getArenaInfo()` - Get Arena run information
- `getArenaDeck()` - Get current Arena deck

### Deck Methods

- `getActiveDeck(selectedDeckId?, forceReset?)` - Get the currently active deck
- `getSelectedDeckId(forceReset)` - Get the ID of the selected deck
- `getWhizbangDeck(deckId?)` - Get Whizbang deck information

### Rewards and Progression Methods

- `getRewardsTrackInfo()` - Get rewards track progress
- `getBoostersInfo()` - Get booster pack information
- `getActiveQuests()` - Get active quest information

### Achievements Methods

- `getAchievementsInfo(forceReset?)` - Get achievements information
- `getAchievementCategories(forceReset?)` - Get achievement categories
- `getInGameAchievementsProgressInfo(achievementIds)` - Get in-game achievement progress
- `getInGameAchievementsProgressInfoByIndex(achievementIds)` - Get achievement progress by index

### Player Info Methods

- `getPlayerProfileInfo()` - Get player profile information
- `getAccountInfo()` - Get Battle.net account information

### Plugin Lifecycle Methods

- `reset()` - Reset the plugin state
- `tearDown()` - Clean up and shut down the plugin

## Troubleshooting

### Build Issues

**Error: "Module did not self-register"**

- Run: `npm run build:mindvision:clean`
- This rebuilds the native modules from scratch

**Error: "Cannot find module 'electron-edge-js'"**

- Ensure dependencies are installed: `npm install`
- The module should be in devDependencies

**Error: "DLL not found"**

- Verify `OverwolfUnitySpy.dll` is in the `overwolf-plugins/` directory
- Check that the file path in MindVisionBridge.cs matches your setup

**Error: "Plugin not initialized"**

- Ensure Hearthstone is running before initializing
- Check console logs for initialization errors
- Verify all event handlers are set up correctly

### Runtime Issues

**Memory updates not received**

- Check that `startListeningWithCallback()` was called successfully
- Verify Hearthstone is in focus and actively running
- Look for callback errors in console logs

**Method calls returning null**

- Ensure `initialize()` completed successfully before calling other methods
- Check that the underlying MindVision plugin is bootstrapped
- Some methods require specific game states (e.g., in a match, in collection, etc.)
