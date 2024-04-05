import { Injectable } from '@angular/core';
import { Card } from '@firestone/memory';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { debounceTime } from 'rxjs';
import { Set, SetCard } from '../../models/set';
import { CollectionManager } from './collection-manager.service';
import { SetsService } from './sets-service.service';

@Injectable()
export class SetsManagerService extends AbstractFacadeService<SetsManagerService> {
	public sets$$: SubscriberAwareBehaviorSubject<readonly Set[]>;

	private collectionManager: CollectionManager;
	private setsService: SetsService;

	private allSets: readonly Set[];

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'SetsManagerService', () => !!this.sets$$);
	}

	protected override assignSubjects() {
		this.sets$$ = this.mainInstance.sets$$;
	}

	protected async init() {
		this.sets$$ = new SubscriberAwareBehaviorSubject<readonly Set[] | null>([]);
		this.collectionManager = AppInjector.get(CollectionManager);
		this.setsService = AppInjector.get(SetsService);

		this.sets$$.onFirstSubscribe(() => {
			this.allSets = this.setsService.getAllSets();
			this.collectionManager.collection$$.pipe(debounceTime(1000)).subscribe((collection) => {
				collection = collection ?? [];
				const newSets = this.allSets.map((set) => this.buildSet(collection, set));
				console.debug('[sets-manager] new sets', collection.length, newSets);
				this.sets$$.next(newSets);
			});
		});
	}

	private buildSet(collection: readonly Card[], set: Set): Set {
		const updatedCards: SetCard[] = this.buildFullCards(collection, set.allCards);
		const ownedLimitCollectibleCards = updatedCards
			.map((card: SetCard) => card.getNumberCollected())
			.reduce((c1, c2) => c1 + c2, 0);
		const ownedLimitCollectiblePremiumCards = updatedCards
			.map((card: SetCard) => card.getNumberCollectedPremium())
			.reduce((c1, c2) => c1 + c2, 0);
		return set.update({
			allCards: updatedCards,
			ownedLimitCollectibleCards: ownedLimitCollectibleCards,
			ownedLimitCollectiblePremiumCards: ownedLimitCollectiblePremiumCards,
		});
	}

	private buildFullCards(collection: readonly Card[], setCards: readonly SetCard[]): SetCard[] {
		return setCards.map((card: SetCard) => {
			const collectionCard: Card = collection.find((collectionCard: Card) => collectionCard.id === card.id);
			const ownedNonPremium = collectionCard ? collectionCard.count : 0;
			const ownedPremium = collectionCard ? collectionCard.premiumCount : 0;
			const ownedDiamond = collectionCard ? collectionCard.diamondCount : 0;
			const ownedSignature = collectionCard ? collectionCard.signatureCount : 0;
			return new SetCard(
				card.id,
				card.name,
				card.classes,
				card.rarity,
				card.cost,
				ownedNonPremium,
				ownedPremium,
				ownedDiamond,
				ownedSignature,
			);
		});
	}
}

export const getCard = (allSets: readonly Set[], cardId: string): SetCard => {
	return allSets?.map((set) => set.getCard(cardId)).find((card) => card);
};

export const getAllCards = (allSets: readonly Set[]): readonly SetCard[] => {
	return allSets?.map((set) => set.allCards).reduce((a, b) => a.concat(b), []);
};
