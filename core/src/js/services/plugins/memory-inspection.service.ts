import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { DuelsRewardsInfo } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { GetSelectedDeckIdOperation } from '@services/plugins/mind-vision/get-selected-deck-id-operation';
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
import { GetAchievementsInfoOperation } from './mind-vision/get-achievements-info-operation';
import { GetActiveDeckOperation } from './mind-vision/get-active-deck-operation';
import { GetArenaInfoOperation } from './mind-vision/get-arena-info-operation';
import { GetBattlegroundsEndGameOperation } from './mind-vision/get-battlegrounds-end-game-operation';
import { GetBattlegroundsInfoOperation } from './mind-vision/get-battlegrounds-info-operation';
import { GetBattlegroundsMatchOperation } from './mind-vision/get-battlegrounds-match-operation';
import { GetBattlegroundsOwnedHeroSkinDbfIdsOperation } from './mind-vision/get-bgs-hero-skin-dbf-ids-operation';
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
import { GetMercenariesCollectionInfoOperation } from './mind-vision/get-mercenaries-collection-info-operation';
import { GetMercenariesInfoOperation } from './mind-vision/get-mercenaries-info-operation';
import { GetRewardsTrackInfoOperation } from './mind-vision/get-rewards-track-info-operation';
import { GetWhizbangDeckOperation } from './mind-vision/get-whizbang-deck-operation';
import { IsMaybeOnDuelsRewardsScreenOperation } from './mind-vision/is-maybe-on-duels-rewards-screen-operation';
import { MindVisionService } from './mind-vision/mind-vision.service';

@Injectable()
export class MemoryInspectionService {
	// https://overwolf.github.io/docs/api/overwolf-games-events-heartstone
	// readonly g_interestedInFeatures = [
	// 	'scene_state', // Used to detect when the UI shows the game
	// 	'match_info', // For the GEP game ID
	// ];

	private getMemoryChangesOperation = new GetMemoryChangesOperation(this.mindVision, this.ow);
	private getCollectionOperation = new GetCollectionOperation(this.mindVision, this.ow, this.cards);
	private getBattlegroundsOwnedHeroSkinDbfIdsOperation = new GetBattlegroundsOwnedHeroSkinDbfIdsOperation(
		this.mindVision,
		this.ow,
		this.cards,
	);
	private getCardBacksOperation = new GetCardBacksOperation(this.mindVision, this.ow, this.cards);
	private getCoinsOperation = new GetCoinsOperation(this.mindVision, this.ow, this.cards);
	private getMatchInfoOperation = new GetMatchInfoOperation(this.mindVision, this.ow);
	private getBattlegroundsInfoOperation = new GetBattlegroundsInfoOperation(this.mindVision, this.ow);
	private getMercenariesInfoOperation = new GetMercenariesInfoOperation(this.mindVision, this.ow);
	private getMercenariesCollectionInfoOperation = new GetMercenariesCollectionInfoOperation(this.mindVision, this.ow);
	private getBattlegroundsEndGameOperation = new GetBattlegroundsEndGameOperation(this.mindVision, this.ow);
	private getBattlegroundsMatchOperation = new GetBattlegroundsMatchOperation(this.mindVision, this.ow);
	private getActiveDeckOperation = new GetActiveDeckOperation(this.mindVision, this.ow);
	private getSelectedDeckIdOperation = new GetSelectedDeckIdOperation(this.mindVision, this.ow);
	private getWhizbangDeckOperation = new GetWhizbangDeckOperation(this.mindVision, this.ow);
	private getArenaInfoOperation = new GetArenaInfoOperation(this.mindVision, this.ow);
	private getDuelsInfoOperation = new GetDuelsInfoOperation(this.mindVision, this.ow, this.i18n);
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
		private readonly ow: OverwolfService,
		private readonly mindVision: MindVisionService,
		private readonly cards: SetsService,
		private readonly i18n: LocalizationFacadeService,
	) {
		// this.init();
	}

	public async getMemoryChanges(): Promise<MemoryUpdate> {
		return this.getMemoryChangesOperation.call();
	}

	public async getCollection(): Promise<readonly Card[]> {
		return this.getCollectionOperation.call();
	}

	public async getBattlegroundsOwnedHeroSkinDbfIds(): Promise<readonly number[]> {
		return this.getBattlegroundsOwnedHeroSkinDbfIdsOperation.call();
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

	public async getMercenariesCollectionInfo(
		numberOfRetries?: number,
		forceResetAfterEmptyCalls = false,
	): Promise<MemoryMercenariesCollectionInfo> {
		let result = await this.getMercenariesCollectionInfoOperation.call(numberOfRetries);
		if (this.getMercenariesCollectionInfoOperation.emptyCheck(result) && forceResetAfterEmptyCalls) {
			result = await this.getMercenariesCollectionInfoOperation.call(numberOfRetries, true);
		}
		return result;
	}

	public async getBattlegroundsEndGame(numberOfRetries?: number): Promise<BattlegroundsInfo> {
		return this.getBattlegroundsEndGameOperation.call(numberOfRetries);
	}

	public async getBattlegroundsMatchWithPlayers(
		numberOfRetries?: number,
		forceReset = false,
	): Promise<BattlegroundsInfo> {
		return this.getBattlegroundsMatchOperation.call(numberOfRetries, forceReset);
	}

	public async getActiveDeck(
		selectedDeckId: number,
		numberOfRetries: number,
		forceResetIfResultEmpty = false,
	): Promise<DeckInfoFromMemory> {
		let result = await this.getActiveDeckOperation.call(numberOfRetries, false, selectedDeckId);
		console.debug('[mind-vision] [getActiveDeck]', result, forceResetIfResultEmpty);
		if (this.getActiveDeckOperation.emptyCheck(result) && forceResetIfResultEmpty) {
			console.debug('[mind-vision] [getActiveDeck]', 'calling with force reset');
			result = await this.getActiveDeckOperation.call(numberOfRetries, true, selectedDeckId);
			console.debug('[mind-vision] [getActiveDeck]', 'after force reset', result);
		}
		return result;
	}

	public async getSelectedDeckId(): Promise<number> {
		const result = await this.getSelectedDeckIdOperation.call();
		console.debug('[mind-vision] [getSelectedDeckId]', result);
		return result;
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
}
