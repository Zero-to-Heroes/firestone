import { Injectable } from '@angular/core';
import { CardPackResult, PackResult } from '@firestone-hs/user-packs';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { BehaviorSubject, filter } from 'rxjs';
import { CardHistory } from '../../../models/card-history';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { cardTypeToPremium } from '../../collection/cards-monitor.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { Events } from '../../events.service';

@Injectable()
export class CollectionBootstrapService {
	public packStats$$ = new SubscriberAwareBehaviorSubject<readonly PackResult[]>([]);
	public cardHistory$$ = new BehaviorSubject<readonly CardHistory[]>([]);

	constructor(private readonly events: Events, private readonly collectionManager: CollectionManager) {
		window['collectionBootstrap'] = this;
		this.init();
	}

	public async newPack(pack: PackResult) {
		const currentStats = await this.packStats$$.getValueWithInit();
		this.packStats$$.next([pack, ...currentStats]);
	}

	private async init() {
		this.events.on(Events.MEMORY_UPDATE).subscribe((event) => {
			const changes: MemoryUpdate = event.data[0];
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
