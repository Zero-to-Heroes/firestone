import { Injectable, NgZone } from '@angular/core';

import { Card } from '../../models/card';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { IndexedDbService } from './indexed-db.service';
import { Events } from '../events.service';
import { resolve } from 'url';

@Injectable()
export class CollectionManager {
	private udpatingCollection: boolean = false;

	constructor(
		private memoryReading: MemoryInspectionService,
		private ngZone: NgZone,
		private events: Events,
		private db: IndexedDbService) {
			this.events.on(Events.NEW_CARD).subscribe((event) => this.updateCollection(event));
	}

	public async getCollection(delay: number = 0): Promise<Card[]> {
		// Apparently this is an anti-pattern, but it works for now
		return new Promise<Card[]>(async (resolve) => {
			console.log('[collection-manager] getting collection');
			const collection = await this.memoryReading.getCollection(delay);
			console.log('[collection-manager] collection from GEP');
			if (!collection || collection.length == 0) {
				console.log('[collection-manager] retrieving collection from db');
				const collectionFromDb = await this.db.getCollection();
				console.log('[collection-manager] retrieved collection from db');
				this.ngZone.run(() => {
					resolve(collectionFromDb);
				});
			}
			else {
				console.log('[collection-manager] updating collection in db');
				const savedCollection =	await this.db.saveCollection(collection);
				resolve(savedCollection);
			}
		});
	}

	// type is NORMAL or GOLDEN
	public inCollection(collection: Card[], cardId: string): Card {
		for (let card of collection) {
			if (card.id === cardId) {
				return card;
			}
		}
		return null;
	}

	private updateCollection(event) {
		if (this.udpatingCollection) {
			return;
		}
		this.udpatingCollection = true;
		// Wait a bit for real update to make sure all card events are processed and that the GEP 
		// has the right version of the collection
		setTimeout(() => this.reallyUpdateCollection(), 3000);
	}

	private async reallyUpdateCollection() {
		const collection = await this.memoryReading.getCollection();
		if (collection && collection.length > 0) {
			await this.db.saveCollection(collection);
		}
		this.udpatingCollection = false;
	}
}
