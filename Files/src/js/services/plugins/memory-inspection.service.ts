import { Injectable } from '@angular/core';

import { DungeonInfo } from '../../models/dungeon-info'
import { Card } from '../../models/card';

declare var OverwolfPlugin: any;
declare var overwolf: any;
declare var parseCardsText: any;

@Injectable()
export class MemoryInspectionService {

	private readonly g_interestedInFeatures: string[] = [
		'scene_state',
		'collection'
	];

	constructor() {
		// overwolf.games.onGameInfoUpdated.addListener((res)  => {
		// 	if (this.gameLaunched(res)) {
		// 		this.registerEvents();
		// 		setTimeout(() => { this.setFeatures() }, 1000);
		// 	}
		// 	console.log("[game-events] onGameInfoUpdated: ", res);
		// });

		// overwolf.games.getRunningGameInfo((res) => {
		// 	if (this.gameRunning(res)) {
		// 		this.registerEvents();
		// 		setTimeout(() => { this.setFeatures() }, 1000);
		// 	}
		// 	console.log("[game-events] getRunningGameInfo: ", res);
		// });
	}

	// registerEvents() {
	// 	console.log("[game-events] Registering events");

	// 	// general events errors
	// 	overwolf.games.events.onError.addListener((info) => {
	// 		console.log("[game-events] Error: ", info);
	// 	});

	// 	// "static" data changed
	// 	// This will also be triggered the first time we register
	// 	// for events and will contain all the current information
	// 	overwolf.games.events.onInfoUpdates2.addListener((info)  => {
	// 		console.log("[game-events] Info UPDATE: ", info);
	// 	});

	// 	// an event triggerd
	// 	overwolf.games.events.onNewEvents.addListener((info)  => {
	// 		console.log("[game-events] EVENT FIRED: ", info);
	// 	});
	// }

	// public getActiveDeck(callback) {
	// 	this.mindvisionPlugin.get().getActiveDeck((activeDeck) => {
	// 		console.log('activeDeck', activeDeck);
	// 		callback(activeDeck);
	// 	});
	// }

	// public getMatchInfo(callback) {
	// 	console.log('Introspecting match info');
	// 	this.mindvisionPlugin.get().getMatchInfo((matchInfo) => {
	// 		console.log('received matchinfo callback', matchInfo);
	// 		callback(matchInfo);
	// 	});
	// }

	// public getArenaInfo(callback) {
	// 	this.mindvisionPlugin.get().getArenaInfo((arenaInfo) => {
	// 		console.log('received arenaInfo callback', arenaInfo);
	// 		callback(arenaInfo);
	// 	});
	// }

	// public getGameFormat(callback) {
	// 	this.mindvisionPlugin.get().getGameFormat((gameFormat) => {
	// 		console.log('received gameFormat callback', gameFormat);
	// 		callback(gameFormat);
	// 	});
	// }

	// public getGameMode(callback) {
	// 	this.mindvisionPlugin.get().getGameMode((gameMode) => {
	// 		console.log('received gameMode callback', gameMode);
	// 		callback(gameMode);
	// 	});
	// }

	// public getDungeonInfo(callback) {
	// 	this.mindvisionPlugin.get().getDungeonInfo((dungeonInfo) => {
	// 		// console.log('received dungeonInfo callback', JSON.parse(dungeonInfo));
	// 		callback(JSON.parse(dungeonInfo));
	// 	});
	// }

	public getCollection(callback) {
		overwolf.games.events.getInfo((info) => {
			console.log('game info', info);
			if (!info.res || !info.res.collection) {
				setTimeout(() => { this.getCollection(callback) }, 100);
				return;
			}
			const collection: Card[] = Object.values(info.res.collection)
					.map(strCard => JSON.parse(strCard));
			console.log('callback', Object.values(info.res.collection), collection);
			callback(collection);
		})
		// this.plugin(
		// 	() => {
		// 		this.mindvisionPlugin.get().getCollection((cards) => {
		// 			callback(JSON.parse(cards));
		// 		})
		// 	}
		// );
	}

	// public getBattleTag(callback) {
	// 	this.plugin(
	// 		() => {
	// 			this.mindvisionPlugin.get().getBattleTag((battleTag) => {
	// 				// console.log('retrieved battletag', battleTag);
	// 				callback(JSON.parse(battleTag));
	// 			})
	// 		}
	// 	);
	// }

	// private plugin(callback) {
	// 	if (!this.mindvisionPlugin || !this.mindvisionPlugin.get()) {
	// 		setTimeout(() => {
	// 			this.plugin(callback);
	// 		}, 200);
	// 		return;
	// 	}
	// 	callback();
	// }

	gameLaunched(gameInfoResult) {
		if (!gameInfoResult) {
			return false;
		}

		if (!gameInfoResult.gameInfo) {
			return false;
		}

		if (!gameInfoResult.runningChanged && !gameInfoResult.gameChanged) {
			return false;
		}

		if (!gameInfoResult.gameInfo.isRunning) {
			return false;
		}

		// NOTE: we divide by 10 to get the game class id without it's sequence number
		if (Math.floor(gameInfoResult.gameInfo.id/10) != 9898) {
			return false;
		}

		console.log("Hearthstone Launched");
		return true;

	}

	gameRunning(gameInfo) {

		if (!gameInfo) {
			return false;
		}

		if (!gameInfo.isRunning) {
			return false;
		}

		// NOTE: we divide by 10 to get the game class id without it's sequence number
		if (Math.floor(gameInfo.id/10) != 9898) {
			return false;
		}

		console.log("Hearthstone running");
		return true;
	}

	setFeatures() {
		overwolf.games.events.setRequiredFeatures(this.g_interestedInFeatures, (info) => {
			if (info.status == "error")
			{
				//console.log("Could not set required features: " + info.reason);
				//console.log("Trying in 2 seconds");
				window.setTimeout(() => { this.setFeatures() }, 2000);
				return;
			}

			console.log("[game-events] Set required features:");
			console.log("[game-events] ", info);
		});
	}

}
