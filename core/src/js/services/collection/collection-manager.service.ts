import { Injectable } from '@angular/core';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { ApiRunner } from '../api-runner';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { IndexedDbService } from './indexed-db.service';

const CARD_BACKS_URL = 'https://static.zerotoheroes.com/hearthstone/data/card-backs.json?v=1';

@Injectable()
export class CollectionManager {
	private referenceCardBacks: readonly CardBack[];

	constructor(
		private memoryReading: MemoryInspectionService,
		private db: IndexedDbService,
		private ow: OverwolfService,
		private api: ApiRunner,
	) {
		this.init();
	}

	public async getCollection(): Promise<Card[]> {
		console.log('[collection-manager] getting collection');
		const collection = await this.memoryReading.getCollection();
		console.log('[collection-manager] retrieved collection from MindVision');
		if (!collection || collection.length === 0) {
			console.log('[collection-manager] retrieving collection from db');
			const collectionFromDb = await this.db.getCollection();
			console.log('[collection-manager] retrieved collection from db', collectionFromDb.length);
			return collectionFromDb;
		} else {
			console.log('[collection-manager] updating collection in db');
			const savedCollection = await this.db.saveCollection(collection);
			return savedCollection;
		}
	}

	public async getCardBacks(): Promise<readonly CardBack[]> {
		console.log('[collection-manager] getting reference card backs');
		this.referenceCardBacks = this.referenceCardBacks ?? (await this.api.callGetApiWithRetries(CARD_BACKS_URL));
		console.log('[collection-manager] getting card backs');
		const cardBacks = await this.memoryReading.getCardBacks();
		//console.log('[collection-manager] retrieved card backs from MindVision', cardBacks);
		if (!cardBacks || cardBacks.length === 0) {
			console.log('[collection-manager] retrieving card backs from db');
			const cardBacksFromDb = await this.db.getCardBacks();
			console.log('[collection-manager] retrieved card backs from db', cardBacksFromDb.length);
			return cardBacksFromDb;
		} else {
			const merged = this.mergeCardBacksData(this.referenceCardBacks, cardBacks);
			//console.log('[collection-manager] updating card backs in db', merged);
			const saved = await this.db.saveCardBacks(merged);
			return saved;
		}
	}

	private mergeCardBacksData(
		referenceCardBacks: readonly CardBack[],
		ownedCardBacks: readonly CardBack[],
	): readonly CardBack[] {
		return referenceCardBacks.map(cardBack => {
			const owned = ownedCardBacks.find(cb => cb.id === cardBack.id);
			return owned
				? ({
						...cardBack,
						owned: true,
				  } as CardBack)
				: cardBack;
		});
	}

	// type is NORMAL or GOLDEN
	public inCollection(collection: Card[], cardId: string): Card {
		for (const card of collection) {
			if (card.id === cardId) {
				return card;
			}
		}
		return null;
	}

	private init() {
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if ((res.gameChanged || res.runningChanged) && (await this.ow.inGame())) {
				console.debug('[collection-manager] reloading collection from memory');
				await Promise.all([this.getCollection(), this.getCardBacks()]);
			}
		});
	}
}
