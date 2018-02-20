import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

import { Card } from '../../models/card';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';

declare var OverwolfPlugin: any;
declare var overwolf: any;

@Injectable()
export class CollectionManager {
	plugin: any;
	mindvisionPlugin: any;

	constructor(private mindVision: MemoryInspectionService) {
	}

	public getCollection(callback: Function) {
		this.mindVision.getCollection((collection) => {
			callback(collection);
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
