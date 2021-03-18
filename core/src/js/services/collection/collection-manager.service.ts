import { Injectable } from '@angular/core';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { PackInfo } from '../../models/collection/pack-info';
import { ApiRunner } from '../api-runner';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { IndexedDbService } from './indexed-db.service';

const CARD_BACKS_URL = 'https://static.zerotoheroes.com/hearthstone/data/card-backs.json?v=3';

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

	public async getCollection(skipMemoryReading = false): Promise<Card[]> {
		console.log('[collection-manager] getting collection');
		const collection = !skipMemoryReading ? await this.memoryReading.getCollection() : null;
		// console.debug('[collection-manager] got collection', collection);
		if (!collection || collection.length === 0) {
			console.log('[collection-manager] retrieving collection from db');
			const collectionFromDb = await this.db.getCollection();
			console.log('[collection-manager] retrieved collection from db', collectionFromDb.length);
			return collectionFromDb;
		} else {
			console.log('[collection-manager] retrieved collection from MindVision, updating collection in db');
			const savedCollection = await this.db.saveCollection(collection);
			return savedCollection;
		}
	}

	public async getPacks(): Promise<readonly PackInfo[]> {
		console.log('[collection-manager] getting pack info');
		const packInfo = await this.memoryReading.getBoostersInfo();
		if (!packInfo || packInfo.length === 0) {
			console.log('[collection-manager] retrieving pack info from db');
			const packsFromDb = await this.db.getPackInfos();
			console.log('[collection-manager] retrieved pack info from db', packsFromDb.length);
			return packsFromDb;
		} else {
			const saved = await this.db.savePackInfos(packInfo);
			return saved;
		}
	}

	public async getCardBacks(): Promise<readonly CardBack[]> {
		console.log('[collection-manager] getting reference card backs');
		this.referenceCardBacks =
			this.referenceCardBacks ?? (await this.api.callGetApiWithRetries(CARD_BACKS_URL)) ?? [];
		console.log('[collection-manager] getting card backs', this.referenceCardBacks?.length);
		const cardBacks = await this.memoryReading.getCardBacks();
		console.log('[collection-manager] retrieved card backs from MindVision', cardBacks?.length);
		if (!cardBacks || cardBacks.length === 0) {
			console.log('[collection-manager] retrieving card backs from db');
			const cardBacksFromDb = await this.db.getCardBacks();
			console.log('[collection-manager] retrieved card backs from db', cardBacksFromDb.length);
			// We do this so that if we update the reference, we still see them until the info
			// has been refreshed from the in-game memory
			const merged = this.mergeCardBacksData(this.referenceCardBacks, cardBacksFromDb);
			return merged;
		} else {
			const merged = this.mergeCardBacksData(this.referenceCardBacks, cardBacks);
			// console.log('[collection-manager] updating card backs in db', merged);
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
			return owned?.owned
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
				await Promise.all([this.getCollection(), this.getCardBacks(), this.getPacks()]);
			}
		});
	}
}
