import { AchievementHistory } from '../../../../models/achievement/achievement-history';
import { Card } from '../../../../models/card';
import { CardHistory } from '../../../../models/card-history';
import { AchievementsState } from '../../../../models/mainwindow/achievements-state';
import { BinderState } from '../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { SocialShareUserInfo } from '../../../../models/mainwindow/social-share-user-info';
import { GameStats } from '../../../../models/mainwindow/stats/game-stats';
import { StatsState } from '../../../../models/mainwindow/stats/stats-state';
import { PityTimer } from '../../../../models/pity-timer';
import { Set, SetCard } from '../../../../models/set';
import { AchievementHistoryStorageService } from '../../../achievement/achievement-history-storage.service';
import { AchievementsLoaderService } from '../../../achievement/data/achievements-loader.service';
import { AllCardsService } from '../../../all-cards.service';
import { CardHistoryStorageService } from '../../../collection/card-history-storage.service';
import { CollectionManager } from '../../../collection/collection-manager.service';
import { PackHistoryService } from '../../../collection/pack-history.service';
import { OverwolfService } from '../../../overwolf.service';
import { GameStatsLoaderService } from '../../../stats/game/game-stats-loader.service';
import { PopulateStoreEvent } from '../events/populate-store-event';
import { AchievementUpdateHelper } from '../helper/achievement-update-helper';
import { Processor } from './processor';

export class PopulateStoreProcessor implements Processor {
	constructor(
		private achievementHistoryStorage: AchievementHistoryStorageService,
		private achievementsHelper: AchievementUpdateHelper,
		private cardHistoryStorage: CardHistoryStorageService,
		private collectionManager: CollectionManager,
		private pityTimer: PackHistoryService,
		private achievementsLoader: AchievementsLoaderService,
		private gameStatsLoader: GameStatsLoaderService,
		private ow: OverwolfService,
		private cards: AllCardsService,
	) {}

	public async process(event: PopulateStoreEvent, currentState: MainWindowState): Promise<MainWindowState> {
		console.log('[populate-store] populating store');
		const [collection, achievements, socialShareUserInfo, stats] = await Promise.all([
			this.populateCollectionState(currentState.binder),
			this.populateAchievementState(currentState.achievements),
			this.initializeSocialShareUserInfo(currentState.socialShareUserInfo),
			this.initialiseGameStats(currentState.stats),
		]);
		// console.error('Adding fake game stats for dev purposes', stats);
		// const matchStats = Object.assign(new MatchStatsState(), currentState.matchStats, {
		// 	visible: true,
		// 	matchStats: {
		// 		id: 1285443,
		// 		reviewId: '5d95de9ed500ca00017f2aff',
		// 		replayKey: 'hearthstone/replay/2019/10/3/3d15b3cb-fcad-4b1a-a53d-a99d845a11a8',
		// 	} as MatchStats,
		// 	currentStat: 'replay',
		// } as MatchStatsState);
		console.log('[populate-store] almost done');
		return Object.assign(new MainWindowState(), currentState, {
			achievements: achievements,
			binder: collection,
			socialShareUserInfo: socialShareUserInfo,
			stats: stats,
			// matchStats: matchStats,
			isVisible: false,
		} as MainWindowState);
	}

	private async initializeSocialShareUserInfo(
		socialShareUserInfo: SocialShareUserInfo,
	): Promise<SocialShareUserInfo> {
		const twitter = await this.ow.getTwitterUserInfo();
		return Object.assign(new SocialShareUserInfo(), socialShareUserInfo, {
			twitter: twitter,
		} as SocialShareUserInfo);
	}

	private async initialiseGameStats(stats: StatsState): Promise<StatsState> {
		const newGameStats: GameStats = await this.gameStatsLoader.retrieveStats();
		return Object.assign(new StatsState(), stats, {
			gameStats: newGameStats,
		} as StatsState);
	}

	private async populateAchievementState(currentState: AchievementsState): Promise<AchievementsState> {
		return Object.assign(new AchievementsState(), currentState, {
			globalCategories: await this.achievementsHelper.buildGlobalCategories(),
			achievementHistory: await this.buildAchievementHistory(),
		} as AchievementsState);
	}

	private async buildAchievementHistory(): Promise<readonly AchievementHistory[]> {
		const [history, achievements] = await Promise.all([
			this.achievementHistoryStorage.loadAll(),
			this.achievementsLoader.getAchievements(),
		]);
		return (
			history
				.filter(history => history.numberOfCompletions === 1)
				.map(history => {
					const matchingAchievement = achievements.find(ach => ach.id === history.achievementId);
					// This can happen with older history items
					if (!matchingAchievement) {
						return null;
					}
					return Object.assign(new AchievementHistory(), history, {
						displayName: achievements.find(ach => ach.id === history.achievementId).displayName,
					} as AchievementHistory);
				})
				.filter(history => history)
				// We want to have the most recent at the top
				.reverse()
		);
	}

	private async populateCollectionState(currentState: BinderState): Promise<BinderState> {
		const cardHistory: readonly CardHistory[] = await this.cardHistoryStorage.loadAll(100);
		return Object.assign(new BinderState(), currentState, {
			allSets: await this.buildSets(),
			cardHistory: cardHistory,
			shownCardHistory: cardHistory,
			totalHistoryLength: await this.cardHistoryStorage.countHistory(),
		} as BinderState);
	}

	private async buildSets(): Promise<readonly Set[]> {
		const collection = await this.collectionManager.getCollection();
		return this.buildSetsFromCollection(collection);
	}

	private async buildSetsFromCollection(collection: Card[]): Promise<readonly Set[]> {
		const pityTimers = await this.pityTimer.getPityTimers();
		return this.cards
			.getAllSets()
			.map(set => ({ set: set, pityTimer: pityTimers.filter(timer => timer.setId === set.id)[0] }))
			.map(set => this.mergeSet(collection, set.set, set.pityTimer));
	}

	private mergeSet(collection: Card[], set: Set, pityTimer: PityTimer): Set {
		const updatedCards: SetCard[] = this.mergeFullCards(collection, set.allCards);
		const ownedLimitCollectibleCards = updatedCards
			.map((card: SetCard) => card.getNumberCollected())
			.reduce((c1, c2) => c1 + c2, 0);
		const ownedLimitCollectiblePremiumCards = updatedCards
			.map((card: SetCard) => card.getNumberCollectedPremium())
			.reduce((c1, c2) => c1 + c2, 0);
		return new Set(
			set.id,
			set.name,
			set.standard,
			updatedCards,
			pityTimer,
			ownedLimitCollectibleCards,
			ownedLimitCollectiblePremiumCards,
		);
	}

	private mergeFullCards(collection: Card[], setCards: readonly SetCard[]): SetCard[] {
		return setCards.map((card: SetCard) => {
			const collectionCard: Card = collection.find((collectionCard: Card) => collectionCard.id === card.id);
			const ownedPremium = collectionCard ? collectionCard.premiumCount : 0;
			const ownedNonPremium = collectionCard ? collectionCard.count : 0;
			return new SetCard(
				card.id,
				card.name,
				card.cardClass,
				card.rarity,
				card.cost,
				ownedNonPremium,
				ownedPremium,
			);
		});
	}
}
