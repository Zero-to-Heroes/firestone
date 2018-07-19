import { Injectable, NgZone } from '@angular/core';

import { Card } from '../../models/card';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { IndexedDbService } from './indexed-db.service';

declare var OverwolfPlugin: any;
declare var overwolf: any;

@Injectable()
export class CollectionManager {
	plugin: any;

	constructor(
		private memoryReading: MemoryInspectionService,
		private ngZone: NgZone,
		private db: IndexedDbService) {
	}

	public getCollection(callback: Function) {
		console.log('getting collection');
		this.memoryReading.getCollection((collection) => {
			console.log('collection from GEP', collection);
			if (!collection || collection.length == 0) {
				console.log('retrieving collection from db', collection);
				this.db.getCollection((collection) => {
					console.log('retrieved collection form db', collection);
					this.ngZone.run(() => {
						callback(collection);
					});
				});
			}
			else {
				console.log('updating collection in db');
				this.db.saveCollection(collection, callback);
			}
		})
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
}
