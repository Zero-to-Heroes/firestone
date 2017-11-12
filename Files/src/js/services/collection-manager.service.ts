import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

import { Card } from '../models/card';

declare var OverwolfPlugin: any;
declare var overwolf: any;

@Injectable()
export class CollectionManager {
	plugin: any;
	mindvisionPlugin: any;

	constructor() {
		console.log("loading mindvision");
		this.mindvisionPlugin = new OverwolfPlugin("mindvision", true);
		this.mindvisionPlugin.initialize((status: boolean) => {
			if (status === false) {
				console.warn("Plugin mindvision couldn't be loaded");
				Raven.captureMessage('mindvision plugin could not be loaded');
				return;
			}
			console.log("Plugin " + this.mindvisionPlugin.get()._PluginName_ + " was loaded!", this.mindvisionPlugin.get());
			this.mindvisionPlugin.get().onGlobalEvent.addListener(function(first, second) {
				console.log('received global event mindvision', first, second);
			});

			// this.mindvisionPlugin.get().getCollection((cards) => {
			// 	let collection: Card[] = JSON.parse(cards);
			// 	console.log('Collection: ', collection);
			// })
		});
	}

	public getCollection(callback: Function) {
		if (!this.mindvisionPlugin.get()) {
			setTimeout(() => this.getCollection(callback), 100);
			return;
		}
		this.mindvisionPlugin.get().getCollection((cards) => {
			let collection: Card[] = JSON.parse(cards);
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
