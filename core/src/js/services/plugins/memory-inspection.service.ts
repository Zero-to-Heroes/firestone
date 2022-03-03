import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { DuelsRewardsInfo } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { MindVisionStateMachineService } from '@services/plugins/mind-vision/mind-vision-state-machine.service';
import { ArenaInfo } from '../../models/arena-info';
import { BattlegroundsInfo } from '../../models/battlegrounds-info';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { PackInfo } from '../../models/collection/pack-info';
import { DuelsInfo } from '../../models/duels-info';
import { DeckInfoFromMemory } from '../../models/mainwindow/decktracker/deck-info-from-memory';
import { MatchInfo } from '../../models/match-info';
import { CoinInfo } from '../../models/memory/coin-info';
import { MemoryMercenariesCollectionInfo } from '../../models/memory/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../../models/memory/memory-mercenaries-info';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { RewardsTrackInfo } from '../../models/rewards-track-info';
import { HsAchievementsInfo } from '../achievement/achievements-info';
import { SetsService } from '../collection/sets-service.service';
import { OverwolfService } from '../overwolf.service';
import { MindVisionFacadeService } from './mind-vision/mind-vision-facade.service';
import { GetAchievementsInfoOperation } from './mind-vision/operations/get-achievements-info-operation';
import { GetActiveDeckOperation } from './mind-vision/operations/get-active-deck-operation';
import { GetArenaInfoOperation } from './mind-vision/operations/get-arena-info-operation';
import { GetBattlegroundsEndGameOperation } from './mind-vision/operations/get-battlegrounds-end-game-operation';
import { GetBattlegroundsInfoOperation } from './mind-vision/operations/get-battlegrounds-info-operation';
import { GetBattlegroundsMatchOperation } from './mind-vision/operations/get-battlegrounds-match-operation';
import { GetBattlegroundsOwnedHeroSkinDbfIdsOperation } from './mind-vision/operations/get-bgs-hero-skin-dbf-ids-operation';
import { GetBoostersInfoOperation } from './mind-vision/operations/get-boosters-info-operation';
import { GetCardBacksOperation } from './mind-vision/operations/get-card-backs-operation';
import { GetCoinsOperation } from './mind-vision/operations/get-coins-operation';
import { GetCollectionOperation } from './mind-vision/operations/get-collection-operation';
import { GetCurrentSceneOperation } from './mind-vision/operations/get-current-scene-operation';
import { GetDuelsInfoOperation } from './mind-vision/operations/get-duels-info-operation';
import { GetDuelsRewardsInfoOperation } from './mind-vision/operations/get-duels-rewards-info-operation';
import { GetInGameAchievementsProgressInfoOperation } from './mind-vision/operations/get-in-game-achievements-progress-info-operation';
import { GetMatchInfoOperation } from './mind-vision/operations/get-match-info-operation';
import { GetMemoryChangesOperation } from './mind-vision/operations/get-memory-changes-operation';
import { GetMercenariesCollectionInfoOperation } from './mind-vision/operations/get-mercenaries-collection-info-operation';
import { GetMercenariesInfoOperation } from './mind-vision/operations/get-mercenaries-info-operation';
import { GetRewardsTrackInfoOperation } from './mind-vision/operations/get-rewards-track-info-operation';
import { GetSelectedDeckIdOperation } from './mind-vision/operations/get-selected-deck-id-operation';
import { GetWhizbangDeckOperation } from './mind-vision/operations/get-whizbang-deck-operation';
import { IsMaybeOnDuelsRewardsScreenOperation } from './mind-vision/operations/is-maybe-on-duels-rewards-screen-operation';

@Injectable()
export class MemoryInspectionService {
	// https://overwolf.github.io/docs/api/overwolf-games-events-heartstone
	// readonly g_interestedInFeatures = [
	// 	'scene_state', // Used to detect when the UI shows the game
	// 	'match_info', // For the GEP game ID
	// ];

	private getMemoryChangesOperation = new GetMemoryChangesOperation(this.mindVisionFacade, this.ow);
	private getCollectionOperation = new GetCollectionOperation(this.mindVisionFacade, this.ow, this.cards);
	private getBattlegroundsOwnedHeroSkinDbfIdsOperation = new GetBattlegroundsOwnedHeroSkinDbfIdsOperation(
		this.mindVisionFacade,
		this.ow,
		this.cards,
	);
	private getCardBacksOperation = new GetCardBacksOperation(this.mindVisionFacade, this.ow, this.cards);
	private getCoinsOperation = new GetCoinsOperation(this.mindVisionFacade, this.ow, this.cards);
	private getMatchInfoOperation = new GetMatchInfoOperation(this.mindVisionFacade, this.ow);
	private getBattlegroundsInfoOperation = new GetBattlegroundsInfoOperation(this.mindVisionFacade, this.ow);
	private getMercenariesInfoOperation = new GetMercenariesInfoOperation(this.mindVisionFacade, this.ow);
	private getMercenariesCollectionInfoOperation = new GetMercenariesCollectionInfoOperation(
		this.mindVisionFacade,
		this.ow,
	);
	private getBattlegroundsEndGameOperation = new GetBattlegroundsEndGameOperation(this.mindVisionFacade, this.ow);
	private getBattlegroundsMatchOperation = new GetBattlegroundsMatchOperation(this.mindVisionFacade, this.ow);
	private getActiveDeckOperation = new GetActiveDeckOperation(this.mindVisionFacade, this.ow);
	private getSelectedDeckIdOperation = new GetSelectedDeckIdOperation(this.mindVisionFacade, this.ow);
	private getWhizbangDeckOperation = new GetWhizbangDeckOperation(this.mindVisionFacade, this.ow);
	private getArenaInfoOperation = new GetArenaInfoOperation(this.mindVisionFacade, this.ow);
	private getDuelsInfoOperation = new GetDuelsInfoOperation(this.mindVisionFacade, this.ow, this.i18n);
	private getDuelsRewardsInfoOperation = new GetDuelsRewardsInfoOperation(this.mindVisionFacade, this.ow);
	private getRewardsTrackInfoOperation = new GetRewardsTrackInfoOperation(this.mindVisionFacade, this.ow);
	private getBoostersInfoOperation = new GetBoostersInfoOperation(this.mindVisionFacade, this.ow);
	private getAchievementsInfoOperation = new GetAchievementsInfoOperation(this.mindVisionFacade, this.ow);
	private getInGameAchievementsProgressInfoOperation = new GetInGameAchievementsProgressInfoOperation(
		this.mindVisionFacade,
		this.ow,
	);
	private getCurrentSceneOperation = new GetCurrentSceneOperation(this.mindVisionFacade, this.ow);
	private isMaybeOnDuelsRewardsScreenOperation = new IsMaybeOnDuelsRewardsScreenOperation(
		this.mindVisionFacade,
		this.ow,
	);

	private listenersRegistered: boolean;

	constructor(
		private readonly ow: OverwolfService,
		private readonly mindVisionFacade: MindVisionFacadeService,
		private readonly mindVision: MindVisionStateMachineService,
		private readonly cards: SetsService,
		private readonly i18n: LocalizationFacadeService,
	) {
		// this.init();
	}

	public async getMemoryChanges(): Promise<MemoryUpdate> {
		return this.mindVision.callMindVision(() => this.getMemoryChangesOperation.call());
	}

	public async getCollection(): Promise<readonly Card[]> {
		return this.mindVision.callMindVision(() => this.getCollectionOperation.call());
	}

	public async getBattlegroundsOwnedHeroSkinDbfIds(): Promise<readonly number[]> {
		return this.mindVision.callMindVision(() => this.getBattlegroundsOwnedHeroSkinDbfIdsOperation.call());
	}

	public async getCardBacks(): Promise<readonly CardBack[]> {
		return this.mindVision.callMindVision(() => this.getCardBacksOperation.call());
	}

	public async getCoins(): Promise<readonly CoinInfo[]> {
		return this.mindVision.callMindVision(() => this.getCoinsOperation.call());
	}

	public async getMatchInfo(): Promise<MatchInfo> {
		return this.mindVision.callMindVision(() => this.getMatchInfoOperation.call());
	}

	public async getBattlegroundsInfo(numberOfRetries?: number): Promise<BattlegroundsInfo> {
		return this.mindVision.callMindVision(() => this.getBattlegroundsInfoOperation.call(numberOfRetries));
	}

	public async getMercenariesInfo(numberOfRetries?: number): Promise<MemoryMercenariesInfo> {
		return this.mindVision.callMindVision(() => this.getMercenariesInfoOperation.call(numberOfRetries));
	}

	public async getMercenariesCollectionInfo(
		numberOfRetries?: number,
		forceResetAfterEmptyCalls = false,
	): Promise<MemoryMercenariesCollectionInfo> {
		return this.mindVision.callMindVision(() => this.getMercenariesCollectionInfoOperation.call(numberOfRetries));
		// let result = await this.getMercenariesCollectionInfoOperation.call(numberOfRetries));
		// if (this.getMercenariesCollectionInfoOperation.emptyCheck(result) && forceResetAfterEmptyCalls) {
		// 	result = await this.getMercenariesCollectionInfoOperation.call(numberOfRetries, true);
		// }
		// return this.mindVision.callMindVision(() => result;
	}

	public async getBattlegroundsEndGame(numberOfRetries?: number): Promise<BattlegroundsInfo> {
		return this.mindVision.callMindVision(() => this.getBattlegroundsEndGameOperation.call(numberOfRetries));
	}

	public async getBattlegroundsMatchWithPlayers(
		numberOfRetries?: number,
		forceReset = false,
	): Promise<BattlegroundsInfo> {
		return this.mindVision.callMindVision(() =>
			this.getBattlegroundsMatchOperation.call(numberOfRetries, forceReset),
		);
	}

	public async getActiveDeck(
		selectedDeckId: number,
		numberOfRetries: number,
		forceResetIfResultEmpty = false,
	): Promise<DeckInfoFromMemory> {
		let result = await this.mindVision.callMindVision(() =>
			this.getActiveDeckOperation.call(numberOfRetries, false, selectedDeckId),
		);
		console.debug('[mind-vision] [getActiveDeck]', result, forceResetIfResultEmpty);
		if (this.getActiveDeckOperation.emptyCheck(result) && forceResetIfResultEmpty) {
			console.debug('[mind-vision] [getActiveDeck]', 'calling with force reset');
			result = await this.mindVision.callMindVision(() =>
				this.getActiveDeckOperation.call(numberOfRetries, true, selectedDeckId),
			);
			console.debug('[mind-vision] [getActiveDeck]', 'after force reset', result);
		}
		return result;
	}

	public async getSelectedDeckId(): Promise<number> {
		// const result = await this.getSelectedDeckIdOperation.call());
		// console.debug('[mind-vision] [getSelectedDeckId]', result);
		return this.mindVision.callMindVision(() => this.getSelectedDeckIdOperation.call());
	}

	public async getWhizbangDeck(deckId: number): Promise<DeckInfoFromMemory> {
		return this.mindVision.callMindVision(() => this.getWhizbangDeckOperation.call(2, false, deckId));
	}

	public async getArenaInfo(): Promise<ArenaInfo> {
		return this.mindVision.callMindVision(() => this.getArenaInfoOperation.call());
	}

	public async getDuelsInfo(forceReset = false, numberOfRetries = 1): Promise<DuelsInfo> {
		return this.mindVision.callMindVision(() => this.getDuelsInfoOperation.call(numberOfRetries, forceReset));
	}

	public async getDuelsRewardsInfo(forceReset = false): Promise<DuelsRewardsInfo> {
		return this.mindVision.callMindVision(() => this.getDuelsRewardsInfoOperation.call(1, forceReset));
	}

	public async getRewardsTrackInfo(): Promise<RewardsTrackInfo> {
		return this.mindVision.callMindVision(() => this.getRewardsTrackInfoOperation.call());
	}

	public async getAchievementsInfo(forceReset = false, numberOfRetries = 1): Promise<HsAchievementsInfo> {
		return this.mindVision.callMindVision(() =>
			this.getAchievementsInfoOperation.call(numberOfRetries, forceReset),
		);
	}

	public async getBoostersInfo(): Promise<readonly PackInfo[]> {
		return this.mindVision.callMindVision(() => this.getBoostersInfoOperation.call());
	}

	public async getInGameAchievementsProgressInfo(
		forceReset = false,
		numberOfRetries = 2,
	): Promise<HsAchievementsInfo> {
		return this.mindVision.callMindVision(() =>
			this.getInGameAchievementsProgressInfoOperation.call(numberOfRetries, forceReset),
		);
	}

	public async getCurrentSceneFromMindVision(): Promise<SceneMode> {
		return this.mindVision.callMindVision(() => this.getCurrentSceneOperation.call());
	}

	public async isMaybeOnDuelsRewardsScreen(): Promise<boolean> {
		return this.mindVision.callMindVision(() => this.isMaybeOnDuelsRewardsScreenOperation.call());
	}

	// public async reset(): Promise<void> {
	// 	await this.mindVision.reset();
	// }
}
