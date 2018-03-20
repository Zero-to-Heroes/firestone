import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

import { Card } from '../../models/card';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { IndexedDbService } from './indexed-db.service';

declare var OverwolfPlugin: any;
declare var overwolf: any;

@Injectable()
export class CollectionManager {
	plugin: any;
	mindvisionPlugin: any;

	constructor(private mindVision: MemoryInspectionService, private db: IndexedDbService) {
	}

	public getCollection(callback: Function) {
		console.log('getting collection');
		this.mindVision.getCollection((collection) => {
			if (!collection) {
				this.db.getCollection((collection) => {
					callback(collection);
				});
			}
			else {
				this.db.saveCollection(collection, callback);
			}
		})
	}

	public inCollection(collection: Card[], cardId: string, type: string): Card {
		for (let card of collection) {
			if (card.Id === cardId && this.isCorrectPremium(card.Premium, type)) {
				return card;
			}
		}
		return null;
	}

	private isCorrectPremium(premium: boolean, type: string): boolean {
		return (!premium && type === 'NORMAL') || (premium && type === 'GOLDEN');
	}
}
