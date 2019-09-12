import { Injectable } from '@angular/core';
import { Card } from '../../models/card';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';

@Injectable()
export class MemoryInspectionService {
	private collectionTriesLeft = 50;
	private playersInfoTriesLeft = 50;

	// https://overwolf.github.io/docs/api/overwolf-games-events-heartstone
	readonly g_interestedInFeatures = [
		'scene_state', // Used to detect when the UI shows the game
		'collection',
		'match', // Used to get the rank info of the player
		'match_info', // For the GEP game ID
	];

	constructor(private events: Events, private ow: OverwolfService) {
		this.init();
	}

	public getCollection(delay: number = 0): Promise<Card[]> {
		this.collectionTriesLeft = 20;
		return new Promise<Card[]>(resolve => {
			this.getCollectionInternal((collection: Card[]) => {
				resolve(collection);
			}, delay);
		});
	}

	public getPlayerInfo(): Promise<{ localPlayer: any; opponent: any }> {
		this.playersInfoTriesLeft = 20;
		return new Promise<{ localPlayer: any; opponent: any }>(resolve => {
			this.getPlayerInfoInternal((playersInfo: { localPlayer: any; opponent: any }) => {
				resolve(playersInfo);
			});
		});
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

	private getCollectionInternal(callback, delay: number = 0) {
		this.collectionTriesLeft--;
		// I observed some cases where the new card information was not present in the memory reading
		// right after I had gotten it from a pack, so let's add a little delay
		setTimeout(async () => {
			const info = await this.ow.getGameEventsInfo();
			if (!info.res || !info.res.collection) {
				// If game is running, we should have something in the collection
				// This might cause an issue if we're dealing with someone who has zero
				// cards in their collection, but it's unlikely that totally beginners would
				// use an app
				// console.log('[memory service] [collection-manager] no collection info', info);
				const gameInfo = await this.ow.getRunningGameInfo();
				if (this.ow.gameRunning(gameInfo) && this.collectionTriesLeft > 0) {
					console.log('[memory service] [collection-manager] game is running, GEP should return a collection. Waiting...');
					setTimeout(() => this.getCollectionInternal(callback, delay), 2000);
					return;
				} else {
					callback([]);
					return;
				}
			}
			// console.log('[memory service] [collection-manager] collection info', info);
			const collection: Card[] = (Object as any).values(info.res.collection).map(strCard => JSON.parse(strCard));
			// console.log('callback', collection);
			callback(collection);
		}, delay);
	}

	private async getPlayerInfoInternal(callback) {
		// console.log('[memory service] trying to get player info');
		this.playersInfoTriesLeft--;
		const info = await this.ow.getGameEventsInfo();
		if (info && info.res && info.res.playersInfo) {
			console.log('[memory-service] fetched playersInfo', info.res.playersInfo);
			const localPlayer: string = info.res.playersInfo.localPlayer;
			const opponent: string = info.res.playersInfo.opponent;
			callback({
				localPlayer: JSON.parse(localPlayer),
				oppoennt: JSON.parse(opponent),
			});
			return;
		}
		setTimeout(() => this.getPlayerInfoInternal(callback), 2000);
		// console.warn('[memory-service] could not fetch playersInfo', info);
		// resolve(null);
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
		} else if (info.feature === 'match_info' && info.info && info.info.match_info && info.info.match_info.pseudo_match_id) {
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
