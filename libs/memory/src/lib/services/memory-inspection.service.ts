import { Injectable } from '@angular/core';
import { BnetRegion, Board, SceneMode } from '@firestone-hs/reference-data';
import { PackInfo } from '@firestone/collection/view';
import { OverwolfService } from '@firestone/shared/framework/core';
import { HsAchievementCategory, HsAchievementsInfo } from '../external-models/achievements-info';
import { ArenaInfo } from '../external-models/arena-info';
import { Card } from '../external-models/card';
import { CardBack } from '../external-models/card-back';
import { MatchInfo } from '../external-models/match-info';
import { AccountInfo } from '../models/account';
import { BattlegroundsInfo } from '../models/battlegrounds-info';
import { MemoryBgsPlayerInfo, MemoryBgsTeamInfo } from '../models/battlegrounds-player-state';
import { CoinInfo } from '../models/coin-info';
import { DeckInfoFromMemory } from '../models/deck-info-from-memory';
import { MemoryMercenariesCollectionInfo } from '../models/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../models/memory-mercenaries-info';
import { MemoryPlayerProfileInfo } from '../models/memory-profile-info';
import { MemoryUpdate } from '../models/memory-update';
import { MemoryQuestsLog } from '../models/quests';
import { RewardsTrackInfos } from '../models/rewards-track-info';
import { MindVisionFacadeService } from './mind-vision/mind-vision-facade.service';
import { MindVisionStateMachineService } from './mind-vision/mind-vision-state-machine.service';
import { GetAccountInfoOperation } from './mind-vision/operations/get-account-info-operation';
import { GetAchievementCategoriesOperation } from './mind-vision/operations/get-achievements-categories-operation';
import { GetAchievementsInfoOperation } from './mind-vision/operations/get-achievements-info-operation';
import { GetActiveDeckOperation } from './mind-vision/operations/get-active-deck-operation';
import { GetActiveQuestsOperation } from './mind-vision/operations/get-active-quests-operation';
import { GetArenaDeckOperation } from './mind-vision/operations/get-arena-deck-operation';
import { GetArenaInfoOperation } from './mind-vision/operations/get-arena-info-operation';
import { GetBattlegroundsEndGameOperation } from './mind-vision/operations/get-battlegrounds-end-game-operation';
import { GetBattlegroundsInfoOperation } from './mind-vision/operations/get-battlegrounds-info-operation';
import { GetBattlegroundsMatchOperation } from './mind-vision/operations/get-battlegrounds-match-operation';
import { GetBattlegroundsSelectedModeOperation } from './mind-vision/operations/get-battlegrounds-selected-mode-operation';
import { GetBattlegroundsOwnedHeroSkinDbfIdsOperation } from './mind-vision/operations/get-bgs-hero-skin-dbf-ids-operation';
import { GetBgsPlayerBoardOperation } from './mind-vision/operations/get-bgs-player-board-operation';
import { GetBgsPlayerTeammateBoardOperation } from './mind-vision/operations/get-bgs-player-teammate-board-operation';
import { GetBoardOperation } from './mind-vision/operations/get-board-operation';
import { GetBoostersInfoOperation } from './mind-vision/operations/get-boosters-info-operation';
import { GetCardBacksOperation } from './mind-vision/operations/get-card-backs-operation';
import { GetCoinsOperation } from './mind-vision/operations/get-coins-operation';
import { GetCollectionOperation } from './mind-vision/operations/get-collection-operation';
import { GetCurrentSceneOperation } from './mind-vision/operations/get-current-scene-operation';
import { GetGameUniqueIdOperation } from './mind-vision/operations/get-game-unique-id-operation';
import { GetInGameAchievementsProgressInfoByIndexOperation } from './mind-vision/operations/get-in-game-achievements-progress-info-by-index-operation';
import { GetInGameAchievementsProgressInfoOperation } from './mind-vision/operations/get-in-game-achievements-progress-info-operation';
import { GetMatchInfoOperation } from './mind-vision/operations/get-match-info-operation';
import { GetMemoryChangesOperation } from './mind-vision/operations/get-memory-changes-operation';
import { GetMercenariesCollectionInfoOperation } from './mind-vision/operations/get-mercenaries-collection-info-operation';
import { GetMercenariesInfoOperation } from './mind-vision/operations/get-mercenaries-info-operation';
import { GetPlayerProfileInfoOperation } from './mind-vision/operations/get-profile-info-operation';
import { GetRegionOperation } from './mind-vision/operations/get-region-operation';
import { GetRewardsTrackInfoOperation } from './mind-vision/operations/get-rewards-track-info-operation';
import { GetSelectedDeckIdOperation } from './mind-vision/operations/get-selected-deck-id-operation';
import { GetWhizbangDeckOperation } from './mind-vision/operations/get-whizbang-deck-operation';

@Injectable()
export class MemoryInspectionService {
	// https://overwolf.github.io/docs/api/overwolf-games-events-heartstone
	// readonly g_interestedInFeatures = [
	// 	'scene_state', // Used to detect when the UI shows the game
	// 	'match_info', // For the GEP game ID
	// ];

	private getMemoryChangesOperation = new GetMemoryChangesOperation(this.mindVisionFacade, this.ow);
	private getCollectionOperation = new GetCollectionOperation(this.mindVisionFacade, this.ow);
	private getBattlegroundsOwnedHeroSkinDbfIdsOperation = new GetBattlegroundsOwnedHeroSkinDbfIdsOperation(
		this.mindVisionFacade,
		this.ow,
	);
	private getCardBacksOperation = new GetCardBacksOperation(this.mindVisionFacade, this.ow);
	private getCoinsOperation = new GetCoinsOperation(this.mindVisionFacade, this.ow);
	private getMatchInfoOperation = new GetMatchInfoOperation(this.mindVisionFacade, this.ow);
	private getBoardOperation = new GetBoardOperation(this.mindVisionFacade, this.ow);
	private getBattlegroundsInfoOperation = new GetBattlegroundsInfoOperation(this.mindVisionFacade, this.ow);
	private getBgsPlayerTeammateBoardOperation = new GetBgsPlayerTeammateBoardOperation(this.mindVisionFacade, this.ow);
	private getBgsPlayerBoardOperation = new GetBgsPlayerBoardOperation(this.mindVisionFacade, this.ow);
	private getBattlegroundsSelectedModeOperation = new GetBattlegroundsSelectedModeOperation(
		this.mindVisionFacade,
		this.ow,
	);
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
	private getArenaDeckOperation = new GetArenaDeckOperation(this.mindVisionFacade, this.ow);
	private getRewardsTrackInfoOperation = new GetRewardsTrackInfoOperation(this.mindVisionFacade, this.ow);
	private getBoostersInfoOperation = new GetBoostersInfoOperation(this.mindVisionFacade, this.ow);
	private getAchievementsInfoOperation = new GetAchievementsInfoOperation(this.mindVisionFacade, this.ow);
	private getAchievementCategoriesOperation = new GetAchievementCategoriesOperation(this.mindVisionFacade, this.ow);
	private getInGameAchievementsProgressInfoOperation = new GetInGameAchievementsProgressInfoOperation(
		this.mindVisionFacade,
		this.ow,
	);
	private getInGameAchievementsProgressInfoByIndexOperation = new GetInGameAchievementsProgressInfoByIndexOperation(
		this.mindVisionFacade,
		this.ow,
	);
	private getCurrentSceneOperation = new GetCurrentSceneOperation(this.mindVisionFacade, this.ow);
	private getActiveQuestsOperation = new GetActiveQuestsOperation(this.mindVisionFacade, this.ow);
	private getProfileInfoOperation = new GetPlayerProfileInfoOperation(this.mindVisionFacade, this.ow);
	private getGameUniqueIdOperation = new GetGameUniqueIdOperation(this.mindVisionFacade, this.ow);
	private getRegionOperation = new GetRegionOperation(this.mindVisionFacade, this.ow);
	private getAccountInfoOperation = new GetAccountInfoOperation(this.mindVisionFacade, this.ow);

	private listenersRegistered: boolean;

	constructor(
		private readonly ow: OverwolfService,
		private readonly mindVisionFacade: MindVisionFacadeService,
		private readonly mindVision: MindVisionStateMachineService,
	) {}

	public async getMemoryChanges(): Promise<MemoryUpdate | null> {
		return this.mindVision.callMindVision(() => this.getMemoryChangesOperation.call());
	}

	public async getCollection(): Promise<readonly Card[] | null> {
		return this.mindVision.callMindVision(() => this.getCollectionOperation.call());
	}

	public async getBattlegroundsOwnedHeroSkinDbfIds(): Promise<readonly number[] | null> {
		return this.mindVision.callMindVision(() => this.getBattlegroundsOwnedHeroSkinDbfIdsOperation.call());
	}

	public async getCardBacks(): Promise<readonly CardBack[] | null> {
		return this.mindVision.callMindVision(() => this.getCardBacksOperation.call());
	}

	public async getCoins(): Promise<readonly CoinInfo[] | null> {
		return this.mindVision.callMindVision(() => this.getCoinsOperation.call());
	}

	public async getMatchInfo(): Promise<MatchInfo | null> {
		return this.mindVision.callMindVision(() => this.getMatchInfoOperation.call());
	}

	public async getCurrentBoard(): Promise<Board | null> {
		return this.mindVision.callMindVision(() => this.getBoardOperation.call());
	}

	public async getBattlegroundsInfo(numberOfRetries?: number): Promise<BattlegroundsInfo | null> {
		return this.mindVision.callMindVision(() => this.getBattlegroundsInfoOperation.call(numberOfRetries));
	}

	public async getBattlegroundsSelectedMode(): Promise<'solo' | 'duos' | null> {
		return this.mindVision.callMindVision(() => this.getBattlegroundsSelectedModeOperation.call());
	}

	public async getBgsPlayerBoard(): Promise<MemoryBgsTeamInfo | null> {
		return this.mindVision.callMindVision(() => this.getBgsPlayerBoardOperation.call());
	}

	public async getBgsPlayerTeammateBoard(): Promise<MemoryBgsPlayerInfo | null> {
		return this.mindVision.callMindVision(() => this.getBgsPlayerTeammateBoardOperation.call());
	}

	public async getMercenariesInfo(numberOfRetries?: number): Promise<MemoryMercenariesInfo | null> {
		return this.mindVision.callMindVision(() => this.getMercenariesInfoOperation.call(numberOfRetries));
	}

	public async getMercenariesCollectionInfo(
		numberOfRetries?: number,
		forceResetAfterEmptyCalls = false,
	): Promise<MemoryMercenariesCollectionInfo | null> {
		return this.mindVision.callMindVision(() => this.getMercenariesCollectionInfoOperation.call(numberOfRetries));
	}

	public async getBattlegroundsEndGame(): Promise<BattlegroundsInfo | null> {
		return this.mindVision.callMindVision(() => this.getBattlegroundsEndGameOperation.call());
	}

	public async getBattlegroundsMatchWithPlayers(
		numberOfRetries?: number,
		forceReset = false,
	): Promise<BattlegroundsInfo | null> {
		return this.mindVision.callMindVision(() =>
			this.getBattlegroundsMatchOperation.call(numberOfRetries, forceReset),
		);
	}

	public async getActiveDeck(
		selectedDeckId: number,
		numberOfRetries: number,
		forceResetIfResultEmpty = false,
	): Promise<DeckInfoFromMemory | null> {
		let result = await this.mindVision.callMindVision(() =>
			this.getActiveDeckOperation.call(numberOfRetries, false, selectedDeckId),
		);
		if (this.getActiveDeckOperation.emptyCheck(result) && forceResetIfResultEmpty) {
			result = await this.mindVision.callMindVision(() =>
				this.getActiveDeckOperation.call(numberOfRetries, true, selectedDeckId),
			);
		}
		return result;
	}

	public async getSelectedDeckId(): Promise<number | null> {
		// const result = await this.getSelectedDeckIdOperation.call());
		return this.mindVision.callMindVision(() => this.getSelectedDeckIdOperation.call());
	}

	public async getWhizbangDeck(deckId: number): Promise<DeckInfoFromMemory | null> {
		return this.mindVision.callMindVision(() => this.getWhizbangDeckOperation.call(2, false, deckId));
	}

	public async getArenaInfo(): Promise<ArenaInfo | null> {
		return this.mindVision.callMindVision(() => this.getArenaInfoOperation.call());
	}

	public async getArenaDeck(): Promise<DeckInfoFromMemory | null> {
		return this.mindVision.callMindVision(() => this.getArenaDeckOperation.call());
	}

	public async getRewardsTrackInfo(): Promise<RewardsTrackInfos | null> {
		return this.mindVision.callMindVision(() => this.getRewardsTrackInfoOperation.call());
	}

	public async getAchievementsInfo(forceReset = false, numberOfRetries = 1): Promise<HsAchievementsInfo | null> {
		return this.mindVision.callMindVision(() =>
			this.getAchievementsInfoOperation.call(numberOfRetries, forceReset),
		);
	}

	public async getAchievementCategories(): Promise<readonly HsAchievementCategory[] | null> {
		return this.mindVision.callMindVision(() => this.getAchievementCategoriesOperation.call());
	}

	public async getBoostersInfo(): Promise<readonly PackInfo[] | null> {
		return this.mindVision.callMindVision(() => this.getBoostersInfoOperation.call());
	}

	public async getInGameAchievementsProgressInfo(
		achievementIds: readonly number[],
	): Promise<HsAchievementsInfo | null> {
		return this.mindVision.callMindVision(() =>
			this.getInGameAchievementsProgressInfoOperation.call(1, false, achievementIds),
		);
	}

	public async getInGameAchievementsProgressInfoByIndex(
		achievementIds: readonly number[],
	): Promise<HsAchievementsInfo | null> {
		return this.mindVision.callMindVision(() =>
			this.getInGameAchievementsProgressInfoByIndexOperation.call(1, false, achievementIds),
		);
	}

	public async getCurrentSceneFromMindVision(): Promise<SceneMode | null> {
		return this.mindVision.callMindVision(() => this.getCurrentSceneOperation.call());
	}

	public async getActiveQuests(): Promise<MemoryQuestsLog | null> {
		return this.mindVision.callMindVision(() => this.getActiveQuestsOperation.call());
	}

	public async getProfileInfo(): Promise<MemoryPlayerProfileInfo | null> {
		return this.mindVision.callMindVision(() => this.getProfileInfoOperation.call());
	}

	public async getGameUniqueId(): Promise<string | null> {
		return this.mindVision.callMindVision(() => this.getGameUniqueIdOperation.call());
	}

	public async getRegion(): Promise<BnetRegion | null> {
		// return BnetRegion.REGION_CN;
		return this.mindVision.callMindVision(() => this.getRegionOperation.call());
	}

	public async getAccountInfo(): Promise<AccountInfo | null> {
		return this.mindVision.callMindVision(() => this.getAccountInfoOperation.call());
	}
}
