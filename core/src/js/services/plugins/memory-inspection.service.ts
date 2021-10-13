import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { DuelsRewardsInfo } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { ArenaInfo } from '../../models/arena-info';
import { BattlegroundsInfo } from '../../models/battlegrounds-info';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { PackInfo } from '../../models/collection/pack-info';
import { DuelsInfo } from '../../models/duels-info';
import { DeckInfoFromMemory } from '../../models/mainwindow/decktracker/deck-info-from-memory';
import { MatchInfo } from '../../models/match-info';
import { CoinInfo } from '../../models/memory/coin-info';
import { MemoryMercenariesInfo } from '../../models/memory/memory-mercenaries-info';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { RewardsTrackInfo } from '../../models/rewards-track-info';
import { HsAchievementsInfo } from '../achievement/achievements-info';
import { SetsService } from '../collection/sets-service.service';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { GetAchievementsInfoOperation } from './mind-vision/get-achievements-info-operation';
import { GetActiveDeckOperation } from './mind-vision/get-active-deck-operation';
import { GetArenaInfoOperation } from './mind-vision/get-arena-info-operation';
import { GetBattlegroundsEndGameOperation } from './mind-vision/get-battlegrounds-end-game-operation';
import { GetBattlegroundsInfoOperation } from './mind-vision/get-battlegrounds-info-operation';
import { GetBattlegroundsMatchOperation } from './mind-vision/get-battlegrounds-match-operation';
import { GetBoostersInfoOperation } from './mind-vision/get-boosters-info-operation';
import { GetCardBacksOperation } from './mind-vision/get-card-backs-operation';
import { GetCoinsOperation } from './mind-vision/get-coins-operation';
import { GetCollectionOperation } from './mind-vision/get-collection-operation';
import { GetCurrentSceneOperation } from './mind-vision/get-current-scene-operation';
import { GetDuelsInfoOperation } from './mind-vision/get-duels-info-operation';
import { GetDuelsRewardsInfoOperation } from './mind-vision/get-duels-rewards-info-operation';
import { GetInGameAchievementsProgressInfoOperation } from './mind-vision/get-in-game-achievements-progress-info-operation';
import { GetMatchInfoOperation } from './mind-vision/get-match-info-operation';
import { GetMemoryChangesOperation } from './mind-vision/get-memory-changes-operation';
import { GetMercenariesInfoOperation } from './mind-vision/get-mercenaries-info-operation copy';
import { GetRewardsTrackInfoOperation } from './mind-vision/get-rewards-track-info-operation';
import { GetWhizbangDeckOperation } from './mind-vision/get-whizbang-deck-operation';
import { IsMaybeOnDuelsRewardsScreenOperation } from './mind-vision/is-maybe-on-duels-rewards-screen-operation';
import { MindVisionService } from './mind-vision/mind-vision.service';

@Injectable()
export class MemoryInspectionService {
	// https://overwolf.github.io/docs/api/overwolf-games-events-heartstone
	readonly g_interestedInFeatures = [
		'scene_state', // Used to detect when the UI shows the game
		'match_info', // For the GEP game ID
	];

	private getMemoryChangesOperation = new GetMemoryChangesOperation(this.mindVision, this.ow);
	private getCollectionOperation = new GetCollectionOperation(this.mindVision, this.ow, this.cards);
	private getCardBacksOperation = new GetCardBacksOperation(this.mindVision, this.ow, this.cards);
	private getCoinsOperation = new GetCoinsOperation(this.mindVision, this.ow, this.cards);
	private getMatchInfoOperation = new GetMatchInfoOperation(this.mindVision, this.ow);
	private getBattlegroundsInfoOperation = new GetBattlegroundsInfoOperation(this.mindVision, this.ow);
	private getMercenariesInfoOperation = new GetMercenariesInfoOperation(this.mindVision, this.ow);
	private getBattlegroundsEndGameOperation = new GetBattlegroundsEndGameOperation(this.mindVision, this.ow);
	private getBattlegroundsMatchOperation = new GetBattlegroundsMatchOperation(this.mindVision, this.ow);
	private getActiveDeckOperation = new GetActiveDeckOperation(this.mindVision, this.ow);
	private getWhizbangDeckOperation = new GetWhizbangDeckOperation(this.mindVision, this.ow);
	private getArenaInfoOperation = new GetArenaInfoOperation(this.mindVision, this.ow);
	private getDuelsInfoOperation = new GetDuelsInfoOperation(this.mindVision, this.ow);
	private getDuelsRewardsInfoOperation = new GetDuelsRewardsInfoOperation(this.mindVision, this.ow);
	private getRewardsTrackInfoOperation = new GetRewardsTrackInfoOperation(this.mindVision, this.ow);
	private getBoostersInfoOperation = new GetBoostersInfoOperation(this.mindVision, this.ow);
	private getAchievementsInfoOperation = new GetAchievementsInfoOperation(this.mindVision, this.ow);
	private getInGameAchievementsProgressInfoOperation = new GetInGameAchievementsProgressInfoOperation(
		this.mindVision,
		this.ow,
	);
	private getCurrentSceneOperation = new GetCurrentSceneOperation(this.mindVision, this.ow);
	private isMaybeOnDuelsRewardsScreenOperation = new IsMaybeOnDuelsRewardsScreenOperation(this.mindVision, this.ow);

	private listenersRegistered: boolean;

	constructor(
		private events: Events,
		private ow: OverwolfService,
		private mindVision: MindVisionService,
		private cards: SetsService,
	) {
		this.init();
	}

	public async getMemoryChanges(): Promise<MemoryUpdate> {
		return this.getMemoryChangesOperation.call();
	}

	public async getCollection(): Promise<readonly Card[]> {
		return this.getCollectionOperation.call();
	}

	public async getCardBacks(): Promise<readonly CardBack[]> {
		return this.getCardBacksOperation.call();
	}

	public async getCoins(): Promise<readonly CoinInfo[]> {
		return this.getCoinsOperation.call();
	}

	public async getMatchInfo(): Promise<MatchInfo> {
		return this.getMatchInfoOperation.call();
	}

	public async getBattlegroundsInfo(numberOfRetries?: number): Promise<BattlegroundsInfo> {
		return this.getBattlegroundsInfoOperation.call(numberOfRetries);
	}

	public async getMercenariesInfo(numberOfRetries?: number): Promise<MemoryMercenariesInfo> {
		return this.getMercenariesInfoOperation.call(numberOfRetries);
	}

	public async getBattlegroundsEndGame(numberOfRetries?: number): Promise<BattlegroundsInfo> {
		return this.getBattlegroundsEndGameOperation.call(numberOfRetries);
	}

	public async getBattlegroundsMatchWithPlayers(numberOfRetries?: number): Promise<BattlegroundsInfo> {
		return this.getBattlegroundsMatchOperation.call(numberOfRetries);
	}

	public async getActiveDeck(selectedDeckId: number, numberOfRetries: number): Promise<DeckInfoFromMemory> {
		return this.getActiveDeckOperation.call(numberOfRetries, false, selectedDeckId);
	}

	public async getWhizbangDeck(deckId: number): Promise<DeckInfoFromMemory> {
		return this.getWhizbangDeckOperation.call(2, false, deckId);
	}

	public async getArenaInfo(): Promise<ArenaInfo> {
		return this.getArenaInfoOperation.call();
	}

	public async getDuelsInfo(forceReset = false, numberOfRetries = 1): Promise<DuelsInfo> {
		return this.getDuelsInfoOperation.call(numberOfRetries, forceReset);
	}

	public async getDuelsRewardsInfo(forceReset = false): Promise<DuelsRewardsInfo> {
		return this.getDuelsRewardsInfoOperation.call(1, forceReset);
	}

	public async getRewardsTrackInfo(): Promise<RewardsTrackInfo> {
		return this.getRewardsTrackInfoOperation.call();
	}

	public async getAchievementsInfo(forceReset = false, numberOfRetries = 1): Promise<HsAchievementsInfo> {
		return this.getAchievementsInfoOperation.call(numberOfRetries, forceReset);
	}

	public async getBoostersInfo(): Promise<readonly PackInfo[]> {
		return this.getBoostersInfoOperation.call();
	}

	public async getInGameAchievementsProgressInfo(
		forceReset = false,
		numberOfRetries = 2,
	): Promise<HsAchievementsInfo> {
		return this.getInGameAchievementsProgressInfoOperation.call(numberOfRetries, forceReset);
	}

	public async getCurrentSceneFromMindVision(): Promise<SceneMode> {
		return this.getCurrentSceneOperation.call();
	}

	public async isMaybeOnDuelsRewardsScreen(): Promise<boolean> {
		return this.isMaybeOnDuelsRewardsScreenOperation.call();
	}

	public async reset(): Promise<void> {
		await this.mindVision.reset();
	}

	public async getCurrentScene(): Promise<string> {
		return new Promise<string>(async (resolve) => {
			const gameInfo = await this.ow.getGameEventsInfo();

			resolve(gameInfo?.res?.game_info?.scene_state);
		});
	}

	private handleInfoUpdate(info) {
		if (info.feature === 'scene_state') {
			console.log('[memory service] INFO UPDATE: ', info, info.feature, info.info);
			this.events.broadcast(Events.SCENE_CHANGED, info.info.game_info.scene_state);
		} else if (info.feature === 'match') {
			// This info is only sent when it changed since the last time. So we need to cache it

			if (info.info.playersInfo) {
				const localPlayer: string = info.info.playersInfo.localPlayer;
				const opponent: string = info.info.playersInfo.opponent;

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
		if (this.listenersRegistered) {
			return;
		}

		// general events errors
		this.ow.addGameEventsErrorListener((info) => console.log('[memory service] Error: ', info));

		// "static" data changed
		// This will also be triggered the first time we register
		// for events and will contain all the current information
		this.ow.addGameEventInfoUpdates2Listener((info) => this.handleInfoUpdate(info));

		// an event triggerd
		this.ow.addGameEventsListener((info) => console.log('[memory service] EVENT FIRED: ', info));
		this.listenersRegistered = true;
		console.log('[memory-service] added events listeners');
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
		this.ow.addGameInfoUpdatedListener((res) => {
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
