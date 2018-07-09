import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

import { Card } from '../../models/card';
import { CollectionManager } from './collection-manager.service';
import { Events } from '../events.service';

declare var OverwolfPlugin: any;
declare var overwolf: any;
declare var parseCardsText: any;
declare var ga: any;

@Injectable()
export class LogParserService {
	plugin: any;

	private cardRegex = new RegExp('.* NotifyOfCardGained: \\[.* cardId=(.*) .*\\] (.*) (\\d).*');

	private lastLogReceivedDate: Date;

	constructor(private collectionManager: CollectionManager, private events: Events) {
	}

	public receiveLogLine(data: string) {
		// console.log('received log line', data);
		let match = this.cardRegex.exec(data);
		if (match) {
			// Send a message that a new pack is being opened
			if (!this.lastLogReceivedDate || new Date().getTime() - this.lastLogReceivedDate.getTime() > 1000 * 3)  {
				console.log('notifying new pack opening');
				ga('send', 'event', 'toast', 'new-pack');
				this.events.broadcast(Events.NEW_PACK);
			}

			// console.log('New card received!');
			let cardId = match[1];
			let type = match[2];
			this.collectionManager.getCollection((collection) => {
				ga('send', 'event', 'toast', 'revealed', cardId);
				let cardInCollection = this.collectionManager.inCollection(collection, cardId);
				// console.log('card in collection?', cardId, collection, type, cardInCollection);
				if (!this.hasReachedMaxCollectibleOf(cardInCollection, type)) {
					this.displayNewCardMessage(cardInCollection, type);
				}
				else {
					this.displayDustMessage(cardInCollection, type);
				}
			})
			this.lastLogReceivedDate = new Date();
		}
	}

	private hasReachedMaxCollectibleOf(card: Card, type: string):boolean {
		// Card is not in collection at all
		// Should never occur
		if (!card) {
			console.warn('Should never have a missing card in collection, since the collection is retrieved after card pack opening');
			return false;
		}

		let dbCard = parseCardsText.getCard(card.id);
		if (!dbCard) {
			console.warn('unknown card', card.id, card);
			return false;
		}
		// The collection is updated immediately, so when we query it the new card has already been inserted
		if (type == 'NORMAL' && (dbCard.rarity === 'Legendary' && card.count >= 2) || card.count >= 3) {
			return true;
		}
		if (type == 'GOLDEN' && (dbCard.rarity === 'Legendary' && card.premiumCount >= 2) || card.premiumCount >= 3) {
			return true;
		}
		return false;
	}

	private displayNewCardMessage(card: Card, type: string) {
		console.log('New card!', card.id, type);
		this.events.broadcast(Events.NEW_CARD, card, type);
		ga('send', 'event', 'toast', 'new-card', card.id);
	}

	private displayDustMessage(card: Card, type: string) {
		let dbCard = parseCardsText.getCard(card.id);
		let dust = this.dustFor(dbCard.rarity.toLowerCase());
		dust = type == 'GOLDEN' ? dust * 4 : dust;
		this.events.broadcast(Events.MORE_DUST, card, dust, type);
		ga('send', 'event', 'toast', 'dust', dust);
		console.log('Got ' + dust + ' dust', card.id, type);
	}

	private dustFor(rarity: string): number {
		switch (rarity) {
			case 'legendary':
				return 400;
			case 'epic':
				return 100;
			case 'rare':
				return 20;
			default:
				return 5;
		}
	}
}
