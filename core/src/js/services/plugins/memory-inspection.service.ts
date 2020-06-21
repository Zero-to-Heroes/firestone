import { Injectable } from '@angular/core';
import { ArenaInfo } from '../../models/arena-info';
import { BattlegroundsInfo } from '../../models/battlegrounds-info';
import { Card } from '../../models/card';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { SetsService } from '../sets-service.service';
import { GetActiveDeckOperation } from './mind-vision/get-active-deck-operation';
import { GetArenaInfoOperation } from './mind-vision/get-arena-info-operation';
import { GetBattlegroundsInfoOperation } from './mind-vision/get-battlegrounds-info-operation';
import { GetCollectionOperation } from './mind-vision/get-collection-operation';
import { GetMatchInfoOperation } from './mind-vision/get-match-info-operation';
import { MindVisionService } from './mind-vision/mind-vision.service';

@Injectable()
export class MemoryInspectionService {
	// https://overwolf.github.io/docs/api/overwolf-games-events-heartstone
	readonly g_interestedInFeatures = [
		'scene_state', // Used to detect when the UI shows the game
		// 'collection',
		// 'match', // Used to get the rank info of the player
		'match_info', // For the GEP game ID
	];

	private getCollectionOperation = new GetCollectionOperation(this.mindVision, this.ow, this.cards);
	private getPlayerInfoOperation = new GetMatchInfoOperation(this.mindVision, this.ow);
	private getBattlegroundsInfoOperation = new GetBattlegroundsInfoOperation(this.mindVision, this.ow);
	private getActiveDeckOperation = new GetActiveDeckOperation(this.mindVision, this.ow);
	private getArenaInfoOperation = new GetArenaInfoOperation(this.mindVision, this.ow);

	constructor(
		private events: Events,
		private ow: OverwolfService,
		private mindVision: MindVisionService,
		private cards: SetsService,
	) {
		this.init();
	}

	public async getCollection(): Promise<readonly Card[]> {
		return this.getCollectionOperation.call();
	}

	public async getPlayerInfo(): Promise<{ localPlayer: any; opponent: any }> {
		return this.getPlayerInfoOperation.call();
	}

	public async getBattlegroundsInfo(numberOfRetries?: number): Promise<BattlegroundsInfo> {
		return this.getBattlegroundsInfoOperation.call(numberOfRetries);
	}

	public async getActiveDeck(numberOfRetries?: number): Promise<any> {
		return this.getActiveDeckOperation.call(numberOfRetries);
	}

	public async getArenaInfo(): Promise<ArenaInfo> {
		return this.getArenaInfoOperation.call();
	}

	private handleInfoUpdate(info) {
		// console.log('[memory service] INFO UPDATE: ', info, info.feature, info.info);
		if (info.feature === 'scene_state') {
			console.log('[memory service] INFO UPDATE: ', info, info.feature, info.info);
			this.events.broadcast(Events.SCENE_CHANGED, info.info.game_info.scene_state);
		} else if (info.feature === 'match') {
			// This info is only sent when it changed since the last time. So we need to cache it
			// console.log('[memory service] INFO UPDATE: ', info, info.feature, info.info);
			if (info.info.playersInfo) {
				const localPlayer: string = info.info.playersInfo.localPlayer;
				const opponent: string = info.info.playersInfo.opponent;
				console.log('[memory service] match playersInfo: ', info.info.playersInfo, localPlayer, opponent);
				if (localPlayer) {
					this.events.broadcast(Events.PLAYER_INFO, JSON.parse(localPlayer));
				}
				if (opponent) {
					this.events.broadcast(Events.OPPONENT_INFO, JSON.parse(opponent));
				}
			}
		} else if (
			info.feature === 'match_info' &&
			info.info &&
			info.info.match_info &&
			info.info.match_info.pseudo_match_id
		) {
			this.events.broadcast(Events.NEW_GAME_ID, info.info.match_info.pseudo_match_id);
		}
	}

	private registerEvents() {
		// general events errors
		this.ow.addGameEventsErrorListener(info => console.log('[memory service] Error: ', info));

		// "static" data changed
		// This will also be triggered the first time we register
		// for events and will contain all the current information
		this.ow.addGameEventInfoUpdates2Listener(info => this.handleInfoUpdate(info));

		// an event triggerd
		this.ow.addGameEventsListener(info => console.log('[memory service] EVENT FIRED: ', info));
	}

	private async setFeatures() {
		console.log('[memory service] trying to set features for GEP');
		const info = await this.ow.setGameEventsRequiredFeatures(this.g_interestedInFeatures);
		if (info.status === 'error') {
			setTimeout(() => this.setFeatures(), 2000);
			return;
		}
		console.log('[memory service] Set required features:', info);
	}

	private async init() {
		this.ow.addGameInfoUpdatedListener(res => {
			if (this.ow.gameLaunched(res)) {
				this.registerEvents();
				setTimeout(() => this.setFeatures(), 1000);
			}
		});
		const gameInfo = await this.ow.getRunningGameInfo();
		if (this.ow.gameRunning(gameInfo)) {
			this.registerEvents();
			setTimeout(() => this.setFeatures(), 1000);
		}
	}
}
