import { Processor } from './processor';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { BinderState } from '../../../../models/mainwindow/binder-state';
import { AchievementsState } from '../../../../models/mainwindow/achievements-state';
import { PopulateStoreEvent } from '../events/populate-store-event';
import { AchievementHistory } from '../../../../models/achievement/achievement-history';
import { AchievementHistoryStorageService } from '../../../achievement/achievement-history-storage.service';
import { VisualAchievementCategory } from '../../../../models/visual-achievement-category';
import { AchievementCategory } from '../../../../models/achievement-category';
import { AchievementSet } from '../../../../models/achievement-set';
import { CardHistory } from '../../../../models/card-history';
import { AchievementsRepository } from '../../../achievement/achievements-repository.service';
import { CardHistoryStorageService } from '../../../collection/card-history-storage.service';
import { Set, SetCard } from '../../../../models/set';
import { CollectionManager } from '../../../collection/collection-manager.service';
import { Card } from '../../../../models/card';
import { PityTimer } from '../../../../models/pity-timer';
import { AllCardsService } from '../../../all-cards.service';
import { PackHistoryService } from '../../../collection/pack-history.service';
import { SocialShareUserInfo } from '../../../../models/mainwindow/social-share-user-info';
import { OverwolfService } from '../../../overwolf.service';
import { AchievementNameService } from '../../../achievement/achievement-name.service';

export class PopulateStoreProcessor implements Processor {
	constructor(
		private achievementHistoryStorage: AchievementHistoryStorageService,
		private achievementsRepository: AchievementsRepository,
		private cardHistoryStorage: CardHistoryStorageService,
		private collectionManager: CollectionManager,
		private pityTimer: PackHistoryService,
		private ow: OverwolfService,
		private namingService: AchievementNameService,
		private cards: AllCardsService,
	) {}

	public async process(event: PopulateStoreEvent, currentState: MainWindowState): Promise<MainWindowState> {
		console.log('populating store');
		const collection = await this.populateCollectionState(currentState.binder);
		const achievements = await this.populateAchievementState(currentState.achievements);
		const socialShareUserInfo = await this.initializeSocialShareUserInfo(currentState.socialShareUserInfo);
		console.log('almost done');
		return Object.assign(new MainWindowState(), currentState, {
			achievements: achievements,
			binder: collection,
			socialShareUserInfo: socialShareUserInfo,
			isVisible: false,
		} as MainWindowState);
	}

	private async initializeSocialShareUserInfo(socialShareUserInfo: SocialShareUserInfo): Promise<SocialShareUserInfo> {
		const twitter = await this.ow.getTwitterUserInfo();
		return Object.assign(new SocialShareUserInfo(), socialShareUserInfo, {
			twitter: twitter,
		} as SocialShareUserInfo);
	}

	private async populateAchievementState(currentState: AchievementsState): Promise<AchievementsState> {
		return Object.assign(new AchievementsState(), currentState, {
			globalCategories: await this.buildGlobalCategories(),
			achievementHistory: await this.buildAchievementHistory(),
		} as AchievementsState);
	}

	private async buildAchievementHistory(): Promise<readonly AchievementHistory[]> {
		const history = await this.achievementHistoryStorage.loadAll();
		return (
			history
				.filter(history => history.numberOfCompletions === 1)
				.map(history =>
					Object.assign(new AchievementHistory(), history, {
						displayName: this.namingService.displayName(history.achievementId),
					} as AchievementHistory),
				)
				// We want to have the most recent at the top
				.reverse()
		);
	}

	private async buildGlobalCategories(): Promise<readonly VisualAchievementCategory[]> {
		const globalCategories: AchievementCategory[] = this.achievementsRepository.getCategories();
		const achievementSets: AchievementSet[] = await this.achievementsRepository.loadAggregatedAchievements();
		return globalCategories.map(category => {
			return {
				id: category.id,
				name: category.name,
				icon: category.icon,
				achievementSets: this.buildSetsForCategory(achievementSets, category.achievementSetIds),
			} as VisualAchievementCategory;
		});
	}

	private buildSetsForCategory(achievementSets: AchievementSet[], achievementSetIds: string[]): AchievementSet[] {
		return achievementSets.filter(set => achievementSetIds.indexOf(set.id) !== -1);
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
		const ownedLimitCollectibleCards = updatedCards.map((card: SetCard) => card.getNumberCollected()).reduce((c1, c2) => c1 + c2, 0);
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
			return new SetCard(card.id, card.name, card.cardClass, card.rarity, card.cost, ownedNonPremium, ownedPremium);
		});
	}
}
