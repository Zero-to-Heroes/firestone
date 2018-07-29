import { Injectable, EventEmitter } from '@angular/core';

import { Game } from '../models/game';
import { GameEvent } from '../models/game-event';
import { DungeonInfo } from '../models/dungeon-info';
import { Events } from './events.service';
import { LogListenerService } from './log-listener.service';
import { MemoryInspectionService } from './plugins/memory-inspection.service';

declare var OverwolfPlugin: any;
declare var overwolf: any;

@Injectable()
export class GameEvents {
	public allEvents = new EventEmitter<GameEvent>();
	public newLogLineEvents = new EventEmitter<GameEvent>();
	public onGameStart = new EventEmitter<GameEvent>();

	private gameEventsPlugin: any;

	// The start / end spectating can be set outside of game start / end, so we need to keep it separate
	private spectating: boolean;
	private game: Game;

	constructor(
		private events: Events,
		private memoryInspectionService: MemoryInspectionService) {
		this.init();

		// this.detectMousePicks();
	}

	private logLines: string[] = [];
	private processingLines = false;

	init(): void {
		console.log('init game events monitor');
		let gameEventsPlugin = this.gameEventsPlugin = new OverwolfPlugin("overwolf-replay-converter", true);
		// console.log('plugin', plugin);
		// let that = this;

		gameEventsPlugin.initialize((status: boolean) => {
			if (status === false) {
				console.warn("[game-events] Plugin couldn't be loaded??");
				// Raven.captureMessage('overwolf-replay-converter plugin could not be loaded');
				return;
			}
			console.log("[game-events] Plugin " + gameEventsPlugin.get()._PluginName_ + " was loaded!");
			gameEventsPlugin.get().onGlobalEvent.addListener((first, second) => {
				console.log('[game-events] received global event', first, second);
			});
			gameEventsPlugin.get().onGameEvent.addListener((gameEvent) => {
				// console.log('[game-events] received game event', gameEvent);
				this.dispatchGameEvent(JSON.parse(gameEvent));
			});
			gameEventsPlugin.get().initRealtimeLogConversion();
		});

		setInterval(() => {
			if (this.processingLines) {
				return;
			}
			this.processingLines = true;
			let toProcess: string[] = [];
			while (this.logLines.length > 0) {
				toProcess = [...toProcess, ...this.logLines.splice(0, this.logLines.length)];
			}
			if (toProcess.length > 0) {
				// console.log('processing start', toProcess);
				this.gameEventsPlugin.get().realtimeLogProcessing(toProcess, () => {
					this.processingLines = false;
				});
			}
			else {
				this.processingLines = false;
			}
		},
		500);
	}

	public dispatchGameEvent(gameEvent) {
		switch (gameEvent.Type) {
			case 'NEW_GAME':
				this.game = new Game();
				this.allEvents.next(new GameEvent(GameEvent.GAME_START, this.game));
				this.onGameStart.next(new GameEvent(GameEvent.GAME_START, this.game));
				break;
			case 'LOCAL_PLAYER':
				this.allEvents.next(new GameEvent(GameEvent.LOCAL_PLAYER, gameEvent.Value));
				console.log('received local player', gameEvent.Value);
				break;
			case 'OPPONENT_PLAYER':
				console.log('received opponent', gameEvent.Value);
				this.allEvents.next(new GameEvent(GameEvent.OPPONENT, gameEvent.Value));
				break;
			default:
				console.log('unsupported game event', gameEvent);
		}
	}

	public receiveLogLine(data: string) {
		// Don't use the PowerTaskList
		if (data.indexOf('PowerTaskList') !== -1 || data.indexOf('PowerProcessor') !== -1) {
			return;
		}

		if (data.indexOf('Begin Spectating') !== -1) {
			this.spectating = true;
		}
		if (data.indexOf('End Spectator Mode') !== -1) {
			this.spectating = false;
		}

		if (this.spectating) {
			// For now we're not interested in spectating events, but that will come out later
			return;
		}

		this.logLines.push(data);

		// New game
		// if (data.indexOf('CREATE_GAME') !== -1) {
		// 	console.log('[game-events] reinit game', data);
		// 	this.game = new Game();
		// 	this.game.fullLogs = '';

		// 	// this.parseMatchInfo();
		// 	// this.parseGameMode();
		// 	this.allEvents.next(new GameEvent(GameEvent.GAME_START, this.game));
		// 	this.onGameStart.next(new GameEvent(GameEvent.GAME_START, this.game));
		// }

		if (!this.game) {
			return;
		}

		this.game.fullLogs += data;

		this.parseVictory(data);
	}

	// private detectMousePicks() {
	// 	overwolf.games.inputTracking.onMouseUp.addListener((data) => {
	// 		if (!data.onGame || this.game) {
	// 			return;
	// 		}

	// 		this.detectPick(data);
	// 	});
	// }

	// private detectPick(data) {
	// 	overwolf.games.getRunningGameInfo((result) => {
	// 		let x = 1.0 * data.x / result.width;
	// 		let y = 1.0 * data.y / result.height;
	// 		// console.log('clicked at ', x, y, data, result);

	// 		// Dungeon Run picks
	// 		let maybeDungeonRun = false;
	// 		if (x >= 0.17 && x <= 0.65 && y > 0.22 && y < 0.52) {
	// 			maybeDungeonRun = true;
	// 		}

	// 		if (maybeDungeonRun) {
	// 			this.memoryInspectionService.getDungeonInfo((dungeonInfo: DungeonInfo) => {
	// 				if (!dungeonInfo || !dungeonInfo.IsRunActive) {
	// 					return;
	// 				}

	// 				// console.log('[game-events] active run, emitting event', dungeonInfo);
	// 				this.allEvents.next(new GameEvent(GameEvent.MAYBE_DUNGEON_INFO_PICK, dungeonInfo));
	// 			});
	// 		}
	// 	});
	// }

	// private parseMatchInfo() {
	// 	this.memoryInspectionService.getMatchInfo((matchInfo) => {
	// 		console.log('[game-events] match info is', matchInfo);
	// 		this.game.matchInfo = matchInfo;
	// 		this.allEvents.next(new GameEvent(GameEvent.PLAYER, matchInfo.LocalPlayer));
	// 		this.allEvents.next(new GameEvent(GameEvent.OPPONENT, matchInfo.OpposingPlayer));
	// 	});
	// }

	// private parseGameMode() {
	// 	this.memoryInspectionService.getGameMode((gameMode) => {
	// 		console.log('[game-events] game mode is', gameMode);
	// 		this.game.gameMode = gameMode;
	// 	});
	// }

	private readonly END_REGEX = /D(?:.*)TAG_CHANGE Entity=(.*) tag=PLAYSTATE value=(WON|TIE)/;
	private parseVictory(data: string) {
		// let match = this.END_REGEX.exec(data);
		// if (match) {
		// 	console.log('[game-events] match ended!');
		// 	switch (match[2]) {
		// 		case 'WON':
		// 			let winner = this.game.findPlayerFromName(match[1]);
		// 			this.allEvents.next(new GameEvent(GameEvent.GAME_RESULT, "WINNER", winner, this.game, data));
		// 			break;
		// 		case 'TIE':
		// 			this.allEvents.next(new GameEvent(GameEvent.GAME_RESULT, "TIE", this.game));
		// 			break;
		// 		default:
		// 			throw new Error("Invalid end state for victory: " + match[2]);
		// 	}
		// 	this.game = null;
		// }
	}
}
