import { Injectable } from '@angular/core';
import { BattlegroundsInfo } from '../../models/battlegrounds-info';
import { Card } from '../../models/card';
import { PlayerInfo } from '../../models/player-info';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { MindVisionService } from './mind-vision.service';

@Injectable()
export class MemoryInspectionService {
	// https://overwolf.github.io/docs/api/overwolf-games-events-heartstone
	readonly g_interestedInFeatures = [
		'scene_state', // Used to detect when the UI shows the game
		// 'collection',
		// 'match', // Used to get the rank info of the player
		'match_info', // For the GEP game ID
	];

	constructor(private events: Events, private ow: OverwolfService, private mindVision: MindVisionService) {
		this.init();
	}

	public getCollection(delay: number = 0): Promise<Card[]> {
		return new Promise<Card[]>(resolve => {
			this.getCollectionInternal((collection: Card[]) => resolve(collection), 20, delay);
		});
	}

	private getCollectionInternal(callback, retriesLeft = 20, delay: number = 0) {
		if (retriesLeft <= 0) {
			console.error('[memory-service] [collection-manager] could not retrieve collection');
			callback([]);
			return;
		}
		// I observed some cases where the new card information was not present in the memory reading
		// right after I had gotten it from a pack, so let's add a little delay
		setTimeout(async () => {
			const memoryCollection = await this.mindVision.getCollection();
			if (!memoryCollection || memoryCollection.length === 0) {
				// If game is running, we should have something in the collection
				// This might cause an issue if we're dealing with someone who has zero
				// cards in their collection, but it's unlikely that totally beginners would
				// use an app
				// console.log('[memory service] [collection-manager] no collection info', info);
				const gameInfo = await this.ow.getRunningGameInfo();
				if (this.ow.gameRunning(gameInfo)) {
					console.log(
						'[memory service] [collection-manager] game is running, GEP should return a collection. Waiting...',
					);
					setTimeout(() => this.getCollectionInternal(callback, retriesLeft - 1, delay), 2000);
				} else {
					console.log('[memory service] [collection-manager] game not running, returning empty collection');
					callback([]);
				}
				return;
			}
			console.log('[memory service] [collection-manager] collection info', memoryCollection.length);
			const collection: Card[] = memoryCollection.map(
				memoryCard =>
					({
						id: memoryCard.CardId,
						count: memoryCard.Count,
						premiumCount: memoryCard.PremiumCount,
					} as Card),
			);
			console.log('[memory service] [collection-manager] final collection', collection.length);
			callback(collection);
		}, delay);
	}

	public getPlayerInfo(): Promise<{ localPlayer: any; opponent: any }> {
		// this.playersInfoTriesLeft = 20;
		return new Promise<{ localPlayer: any; opponent: any }>(resolve => {
			this.getPlayerInfoInternal((playersInfo: { localPlayer: any; opponent: any }) => {
				resolve(playersInfo);
			});
		});
	}

	private async getPlayerInfoInternal(callback, triesLeft = 20) {
		// console.log('[memory service] trying to get player info');
		if (triesLeft <= 0) {
			console.error('[memory-service] could not get player info from memory');
			callback(null);
			return;
		}
		const matchInfo = await this.mindVision.getMatchInfo();
		if (matchInfo) {
			console.log('[memory-service] fetched matchInfo', matchInfo);
			const localPlayer = this.extractPlayerInfo(matchInfo.LocalPlayer);
			const opponent = this.extractPlayerInfo(matchInfo.OpposingPlayer);
			callback({
				localPlayer: localPlayer,
				opponent: opponent,
			});
			return;
		}
		setTimeout(() => this.getPlayerInfoInternal(callback, triesLeft - 1), 2000);
	}

	public getBattlegroundsInfo(): Promise<BattlegroundsInfo> {
		// this.playersInfoTriesLeft = 20;
		return new Promise<BattlegroundsInfo>(resolve => {
			this.getBattlegroundsInfoInternal((battlegroundsInfo: BattlegroundsInfo) => {
				resolve(battlegroundsInfo);
			});
		});
	}

	private async getBattlegroundsInfoInternal(callback, triesLeft = 20) {
		if (triesLeft <= 0) {
			console.error('[memory-service] could not get battlegrounds info from memory');
			callback(null);
			return;
		}
		const battlegroundsInfo = await this.mindVision.getBattlegroundsInfo();
		if (battlegroundsInfo) {
			console.log('[memory-service] fetched battlegroundsInfo', battlegroundsInfo);
			callback(
				Object.assign(new BattlegroundsInfo(), {
					rating: battlegroundsInfo.Rating,
					previousRating: battlegroundsInfo.PreviousRating,
				} as BattlegroundsInfo),
			);
			return;
		}
		setTimeout(() => this.getBattlegroundsInfoInternal(callback, triesLeft - 1), 2000);
	}

	private extractPlayerInfo(matchPlayer: any): PlayerInfo {
		return {
			name: matchPlayer.Name,
			cardBackId: matchPlayer.CardBackId,
			standardLegendRank: matchPlayer.StandardLegendRank,
			standardRank: matchPlayer.StandardRank,
			wildLegendRank: matchPlayer.WildLegendRank,
			wildRank: matchPlayer.WildRank,
		} as PlayerInfo;
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

	private handleInfoUpdate(info) {
		// console.log('[memory service] INFO UPDATE: ', info, info.feature, info.info);
		if (info.feature === 'scene_state') {
			// console.log('[memory service] INFO UPDATE: ', info, info.feature, info.info);
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
}
