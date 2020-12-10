import { Injectable } from '@angular/core';
import { Card } from '../../models/card';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { IndexedDbService } from './indexed-db.service';

@Injectable()
export class CollectionManager {
	// TODO: update the collection if the player goes into the game
	constructor(private memoryReading: MemoryInspectionService, private db: IndexedDbService) {}

	public async getCollection(): Promise<Card[]> {
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
}
