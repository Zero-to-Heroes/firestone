import { Injectable } from '@angular/core';

// import * as Raven from 'raven-js';

import { DungeonInfo } from '../../models/dungeon-info'
import { Card } from '../../models/card';

declare var OverwolfPlugin: any;
declare var overwolf: any;
declare var parseCardsText: any;

@Injectable()
export class MemoryInspectionService {
	mindvisionPlugin: any;

	constructor() {
		console.log("loading mindvision");
		this.mindvisionPlugin = new OverwolfPlugin("mindvision", true);
		this.mindvisionPlugin.initialize((status: boolean) => {
			if (status === false) {
				console.warn("Plugin mindvision couldn't be loaded");
				// Raven.captureMessage('mindvision plugin could not be loaded');
				return;
			}
			console.log("Plugin " + this.mindvisionPlugin.get()._PluginName_ + " was loaded!", this.mindvisionPlugin.get());
			this.mindvisionPlugin.get().onGlobalEvent.addListener(function(first, second) {
				console.log('received global event mindvision', first, second);
			});
		});
	}

	public getActiveDeck(callback) {
		this.mindvisionPlugin.get().getActiveDeck((activeDeck) => {
			console.log('activeDeck', activeDeck);
			callback(activeDeck);
		});
	}

	public getMatchInfo(callback) {
		console.log('Introspecting match info');
		this.mindvisionPlugin.get().getMatchInfo((matchInfo) => {
			console.log('received matchinfo callback', matchInfo);
			callback(matchInfo);
		});
	}

	public getArenaInfo(callback) {
		this.mindvisionPlugin.get().getArenaInfo((arenaInfo) => {
			console.log('received arenaInfo callback', arenaInfo);
			callback(arenaInfo);
		});
	}

	public getGameFormat(callback) {
		this.mindvisionPlugin.get().getGameFormat((gameFormat) => {
			console.log('received gameFormat callback', gameFormat);
			callback(gameFormat);
		});
	}

	public getGameMode(callback) {
		this.mindvisionPlugin.get().getGameMode((gameMode) => {
			console.log('received gameMode callback', gameMode);
			callback(gameMode);
		});
	}

	public getDungeonInfo(callback) {
		this.mindvisionPlugin.get().getDungeonInfo((dungeonInfo) => {
			// console.log('received dungeonInfo callback', JSON.parse(dungeonInfo));
			callback(JSON.parse(dungeonInfo));
		});
	}

	public getCollection(callback) {
		this.plugin(
			() => {
				this.mindvisionPlugin.get().getCollection((cards) => {
					callback(JSON.parse(cards));
				})
			}
		);
	}

	private plugin(callback) {
		if (!this.mindvisionPlugin || !this.mindvisionPlugin.get()) {
			setTimeout(() => {
				this.plugin(callback);
			}, 200);
			return;
		}
		callback();
	}
}
