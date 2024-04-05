import { Injectable } from '@angular/core';
import { CardPackResult, PackResult } from '@firestone-hs/user-packs';
import { MemoryUpdatesService } from '@firestone/memory';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject, filter } from 'rxjs';
import { CardHistory } from '../../../models/card-history';
import { cardTypeToPremium } from '../../collection/cards-monitor.service';
import { CollectionManager } from '../../collection/collection-manager.service';

@Injectable()
export class CollectionBootstrapService extends AbstractFacadeService<CollectionBootstrapService> {
	public packStats$$: SubscriberAwareBehaviorSubject<readonly PackResult[]>;
	public cardHistory$$: BehaviorSubject<readonly CardHistory[]>;

	private memoryUpdates: MemoryUpdatesService;
	private collectionManager: CollectionManager;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CollectionBootstrapService', () => !!this.packStats$$);
	}

	protected override assignSubjects() {
		this.packStats$$ = this.mainInstance.packStats$$;
		this.cardHistory$$ = this.mainInstance.cardHistory$$;
	}

	protected async init() {
		this.packStats$$ = new SubscriberAwareBehaviorSubject<readonly PackResult[] | null>([]);
		this.cardHistory$$ = new SubscriberAwareBehaviorSubject<readonly CardHistory[] | null>([]);
		this.memoryUpdates = AppInjector.get(MemoryUpdatesService);
		this.collectionManager = AppInjector.get(CollectionManager);

		this.memoryUpdates.memoryUpdates$$.subscribe(async (changes) => {
			if (changes.CollectionInit) {
				console.debug('[collection-bootstrap] collection init detected in memory updates');
				this.initCollectionState();
			}
		});

		this.packStats$$.onFirstSubscribe(() => {
			console.debug('[collection-bootstrap] first subscription to pack stats, initializing');
			this.initCollectionState();

			this.packStats$$.pipe(filter((packStats) => !!packStats?.length)).subscribe((packStats) => {
				const history = this.buildHistory(packStats);
				console.debug('emitting new card history', history);
				this.cardHistory$$.next(history);
			});
		});
	}

	public async newPack(pack: PackResult) {
		const currentStats = await this.packStats$$.getValueWithInit();
		this.packStats$$.next([pack, ...currentStats]);
	}

	private async initCollectionState(): Promise<void> {
		console.log('initializing collection state');
		const packStats = await this.collectionManager.getPackStats();
		this.packStats$$.next(packStats);
	}

	private buildHistory(packStats: readonly PackResult[]): readonly CardHistory[] {
		return packStats.flatMap((pack) => pack.cards.map((card) => this.buildCardHistory(card, pack.creationDate)));
	}

	private buildCardHistory(card: CardPackResult, creationTimestamp: number): CardHistory {
		const result: CardHistory = {
			cardId: card.cardId,
			premium: cardTypeToPremium(card.cardType, card),
			isNewCard: card.isNew || card.isSecondCopy,
			relevantCount: card.isNew ? 1 : card.isSecondCopy ? 2 : -1,
			creationTimestamp: creationTimestamp,
		};
		return result;
	}
}
