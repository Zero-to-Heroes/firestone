import { Injectable } from '@angular/core';

import { DungeonInfo } from '../../models/dungeon-info'
import { Card } from '../../models/card';

declare var OverwolfPlugin: any;
declare var overwolf: any;
declare var parseCardsText: any;

@Injectable()
export class MemoryInspectionService {

	public getCollection(callback, delay: number = 0) {
		// I observed some cases where the new card information was not present in the memory reading
		// right after I had gotten it from a pack, so let's add a little delay
		setTimeout(() => {
			overwolf.games.events.getInfo((info: any) => {
				if (!info.res || !info.res.collection) {
					// setTimeout(() => { this.getCollection(callback) }, 100);
					callback([]);
					return;
				}
				// console.log('game info', info);
				const collection: Card[] = (<any>Object).values(info.res.collection)
						.map(strCard => JSON.parse(strCard));
				// console.log('callback', collection);
				callback(collection);
			})
		}, delay);
	}
}
