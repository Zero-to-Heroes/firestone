import { Injectable } from '@angular/core';
import { Set, SetCard } from '@firestone/collection/common';
import { SetsService } from '@firestone/collection/data-access';
import { Card } from '@firestone/memory';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { debounceTime } from 'rxjs';
import { CollectionManager } from './collection-manager.service';

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
		this.sets$$ = new SubscriberAwareBehaviorSubject<readonly Set[]>([]) as SubscriberAwareBehaviorSubject<
			readonly Set[]
		>;
		this.collectionManager = AppInjector.get(CollectionManager);
		this.setsService = AppInjector.get(SetsService);

		this.sets$$.onFirstSubscribe(() => {
			this.allSets = this.setsService.getAllSets();
			this.collectionManager.collection$$.pipe(debounceTime(1000)).subscribe((collection) => {
				collection = collection ?? [];
				const newSets = this.allSets.map((set) => this.buildSet(collection, set));
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

	protected override initElectronSubjects(): void {
		this.setupElectronSubject(this.sets$$, 'SetsManagerService-sets', (sets: readonly Set[]) =>
			sets.map((set) => Set.create(set)),
		);
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.sets$$ = new SubscriberAwareBehaviorSubject<readonly Set[]>([]) as SubscriberAwareBehaviorSubject<
			readonly Set[]
		>;
	}

	private buildFullCards(collection: readonly Card[], setCards: readonly SetCard[]): SetCard[] {
		return setCards.map((card: SetCard) => {
			const collectionCard: Card | undefined = collection.find((c: Card) => c.id === card.id);
			const ownedNonPremium = collectionCard?.count ?? 0;
			const ownedPremium = collectionCard?.premiumCount ?? 0;
			const ownedDiamond = collectionCard?.diamondCount ?? 0;
			const ownedSignature = collectionCard?.signatureCount ?? 0;
			const ownedTrial = collectionCard?.trialCount ?? 0;
			const ownedTrialPremium = collectionCard?.trialPremiumCount ?? 0;
			const ownedTrialDiamond = collectionCard?.trialDiamondCount ?? 0;
			const ownedTrialSignature = collectionCard?.trialSignatureCount ?? 0;
			return SetCard.create({
				id: card.id ?? '',
				name: card.name ?? '',
				classes: card.classes ?? [],
				rarity: card.rarity?.toLowerCase(),
				cost: card.cost ?? 0,
				ownedNonPremium: ownedNonPremium ?? 0,
				ownedPremium: ownedPremium ?? 0,
				ownedDiamond: ownedDiamond ?? 0,
				ownedSignature: ownedSignature ?? 0,
				ownedTrial: ownedTrial ?? 0,
				ownedTrialPremium: ownedTrialPremium ?? 0,
				ownedTrialDiamond: ownedTrialDiamond ?? 0,
				ownedTrialSignature: ownedTrialSignature ?? 0,
			});
		});
	}
}

export const getCard = (allSets: readonly Set[], cardId: string): SetCard | undefined =>
	allSets?.map((set) => set.getCard(cardId)).find((card) => card);

export const getAllCards = (allSets: readonly Set[]): readonly SetCard[] =>
	allSets?.map((set) => set.allCards).reduce((a, b) => a.concat(b), []);
