import { Injectable, EventEmitter } from '@angular/core';

import { GameEvent } from '../models/game-event';
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
		console.log(gameEvent.Type + ' event', gameEvent);
		switch (gameEvent.Type) {
			case 'NEW_GAME':
				this.allEvents.next(new GameEvent(GameEvent.GAME_START));
				this.onGameStart.next(new GameEvent(GameEvent.GAME_START));
				break;
			// case 'MATCH_METADATA':
			// 	console.log('received opponent', gameEvent.Value);
			// 	this.allEvents.next(new GameEvent(GameEvent.MATCH_METADATA, gameEvent.Value));
			// 	break;
			case 'LOCAL_PLAYER':
				this.allEvents.next(new GameEvent(GameEvent.LOCAL_PLAYER, gameEvent.Value));
				break;
			case 'OPPONENT_PLAYER':
				this.allEvents.next(new GameEvent(GameEvent.OPPONENT, gameEvent.Value));
				break;
			case 'MULLIGAN_INPUT':
				this.allEvents.next(new GameEvent(GameEvent.MULLIGAN_INPUT));
				break;
			case 'MULLIGAN_DONE':
				this.allEvents.next(new GameEvent(GameEvent.MULLIGAN_DONE));
				break;
			case 'RUMBLE_RUN_STEP':
				this.allEvents.next(new GameEvent(GameEvent.RUMBLE_RUN_STEP, gameEvent.Value - 1));
				break;
			case 'DUNGEON_RUN_STEP':
				this.allEvents.next(new GameEvent(GameEvent.DUNGEON_RUN_STEP, gameEvent.Value - 1));
				break;
			case 'CARD_PLAYED':
				this.allEvents.next(new GameEvent(
					GameEvent.CARD_PLAYED, 
					gameEvent.Value.CardId,
					gameEvent.Value.ControllerId,
					gameEvent.Value.LocalPlayer,
					gameEvent.Value.OpponentPlayer));
				break;
			case 'PASSIVE_BUFF':
				this.allEvents.next(new GameEvent(
					GameEvent.PASSIVE_BUFF, 
					gameEvent.Value.CardId,
					gameEvent.Value.ControllerId,
					gameEvent.Value.LocalPlayer,
					gameEvent.Value.OpponentPlayer));
				break;
			case 'TURN_START':
				this.allEvents.next(new GameEvent(GameEvent.TURN_START, gameEvent.Value));
				break;
			case 'WINNER':
				this.allEvents.next(new GameEvent(
					GameEvent.WINNER,
					gameEvent.Value.Winner,
					gameEvent.Value.LocalPlayer,
					gameEvent.Value.OpponentPlayer));
				break;
			case 'GAME_END':
				this.allEvents.next(new GameEvent(GameEvent.GAME_END, gameEvent.Value.Game, gameEvent.Value.ReplayXml));
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
	}
}
