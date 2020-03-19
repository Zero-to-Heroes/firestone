import { Injectable } from '@angular/core';
import { Card } from '../../models/card';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { IndexedDbService } from './indexed-db.service';

@Injectable()
export class CollectionManager {
	constructor(
		private memoryReading: MemoryInspectionService,
		private db: IndexedDbService,
		private ow: OverwolfService,
		private events: Events,
	) {
		// this.init();
	}

	public async getCollection(delay = 0): Promise<Card[]> {
		console.log('[collection-manager] getting collection');
		const collection = await this.memoryReading.getCollection();
		console.log('[collection-manager] retrieved collection from GEP');
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

	// type is NORMAL or GOLDEN
	public inCollection(collection: Card[], cardId: string): Card {
		for (const card of collection) {
			if (card.id === cardId) {
				return card;
			}
		}
		return null;
	}

	// private init() {
	// 	this.ow.addGameInfoUpdatedListener(async (res: any) => {
	// 		if ((await this.ow.inGame()) && res.runningChanged) {
	// 			console.log('launched game, updating collection', res);
	// 			this.events.broadcast(Events.START_POPULATE_COLLECTION_STATE);
	// 		}
	// 	});
	// }
}
