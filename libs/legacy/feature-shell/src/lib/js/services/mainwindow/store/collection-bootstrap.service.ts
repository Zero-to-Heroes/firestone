import { Injectable } from '@angular/core';
import { CardPackResult, PackResult } from '@firestone-hs/user-packs';
import { BehaviorSubject } from 'rxjs';
import { CardHistory } from '../../../models/card-history';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { cardTypeToPremium } from '../../collection/cards-monitor.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { Events } from '../../events.service';

@Injectable()
export class CollectionBootstrapService {
	public packStats$$ = new BehaviorSubject<readonly PackResult[]>([]);
	public cardHistory$$ = new BehaviorSubject<readonly CardHistory[]>([]);

	constructor(private readonly events: Events, private readonly collectionManager: CollectionManager) {
		window['collectionBootstrap'] = this;
		this.init();
	}

	public newPack(pack: PackResult) {
		const currentStats = this.packStats$$.value;
		this.packStats$$.next([pack, ...currentStats]);
	}

	private async init() {
		this.events.on(Events.MEMORY_UPDATE).subscribe((event) => {
			const changes: MemoryUpdate = event.data[0];
			if (changes.CollectionInit) {
				this.initCollectionState();
			}
		});

		this.packStats$$.subscribe((packStats) => {
			const history = this.buildHistory(packStats);
			console.debug('emitting new card history', history);
			this.cardHistory$$.next(history);
		});

		this.initCollectionState();
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
			premium: cardTypeToPremium(card.cardType),
			isNewCard: card.isNew || card.isSecondCopy,
			relevantCount: card.isNew ? 1 : card.isSecondCopy ? 2 : -1,
			creationTimestamp: creationTimestamp,
		};
		return result;
	}
}
