import { Injectable, NgZone } from '@angular/core';

import { Card } from '../../models/card';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { IndexedDbService } from './indexed-db.service';
import { Events } from '../events.service';

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

	public getCollection(callback: Function, delay: number = 0) {
		console.log('getting collection');
		this.memoryReading.getCollection((collection) => {
			console.log('collection from GEP');
			if (!collection || collection.length == 0) {
				console.log('retrieving collection from db');
				this.db.getCollection((collection) => {
					console.log('retrieved collection form db');
					this.ngZone.run(() => {
						callback(collection);
					});
				});
			}
			else {
				console.log('updating collection in db');
				this.db.saveCollection(collection, callback);
			}
		}, delay);
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

	private reallyUpdateCollection() {
		this.memoryReading.getCollection((collection) => {
			if (collection && collection.length > 0) {
				this.db.saveCollection(collection, () => {});
			}
			this.udpatingCollection = false;
		})
	}
}
