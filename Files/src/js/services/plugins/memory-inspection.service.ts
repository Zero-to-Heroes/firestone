import { Injectable } from '@angular/core';

import { DungeonInfo } from '../../models/dungeon-info'
import { Card } from '../../models/card';

declare var OverwolfPlugin: any;
declare var overwolf: any;
declare var parseCardsText: any;

@Injectable()
export class MemoryInspectionService {

	public getCollection(callback) {
		overwolf.games.events.getInfo((info) => {
			console.log('game info', info);
			if (!info.res || !info.res.collection) {
				setTimeout(() => { this.getCollection(callback) }, 100);
				return;
			}
			const collection: Card[] = Object.values(info.res.collection)
					.map(strCard => JSON.parse(strCard));
			console.log('callback', Object.values(info.res.collection), collection);
			callback(collection);
		})
	}
}
