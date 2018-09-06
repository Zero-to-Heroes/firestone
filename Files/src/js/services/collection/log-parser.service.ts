import { Injectable } from '@angular/core';

import { Card } from '../../models/card';
import { AllCardsService } from '../all-cards.service';
import { Events } from '../events.service';

declare var OverwolfPlugin: any;
declare var overwolf: any;
declare var parseCardsText: any;
declare var ga: any;

@Injectable()
export class LogParserService {
	plugin: any;

	private cardRegex = new RegExp('.* NotifyOfCardGained: \\[.* cardId=(.*) .*\\] (.*) (\\d).*');
	private timestampRegex = new RegExp('D (\\d*):(\\d*):(\\d*).(\\d*) .*');

	private logLines: any[][] = [];
	private processingLines = false;

	constructor(private cards: AllCardsService, private events: Events) {
		setInterval(() => {
			if (this.processingLines) {
				return;
			}
			// Make sure we're not splitting a pack opening in the middle
			if (this.logLines.length > 0 && this.isTooSoon(this.logLines[this.logLines.length -1])) {
				console.log('too soon, waiting before processing');
				return;
			}
			this.processingLines = true;
			let toProcess: string[] = [];
			while (this.logLines.length > 0) {
				toProcess = [...toProcess, ...this.logLines.splice(0, this.logLines.length).map(logLine => logLine[1])];
			}
			if (toProcess.length > 0) {
				console.log('lines to process', toProcess);
				this.processLines(toProcess);
				this.processingLines = false;
			}
			else {
				this.processingLines = false;
			}
		},
		200);
	}

	public receiveLogLine(data: string) {
		// console.log('received log line', data);
		let match = this.cardRegex.exec(data);
		if (match) {
			this.logLines.push([Date.now(), data]);
		}
	}

	private processLines(toProcess: string[]) {
		// Are we opening a pack?
		// console.log('processing lines', toProcess);
		let setId = this.isPack(toProcess)
		if (setId) {
			console.log('notifying new pack opening', setId);
			ga('send', 'event', 'toast', 'new-pack');
			this.events.broadcast(Events.NEW_PACK, setId);
		}

		for (let data of toProcess) {
			// console.log('considering log line', data);
			let match = this.cardRegex.exec(data);
			if (match) {
				let cardId = match[1];
				let type = match[2];
				let newCount = parseInt(match[3]);
				let normalCount: number = type === 'NORMAL' ? newCount : -1;
				let premiumCount: number = type === 'GOLDEN' ? newCount : -1;
				let cardInCollection = new Card(cardId, normalCount, premiumCount);
				// console.log('card in collection?', cardId, type, cardInCollection);
				if (!this.hasReachedMaxCollectibleOf(cardInCollection, type)) {
					this.displayNewCardMessage(cardInCollection, type);
				}
				else {
					this.displayDustMessage(cardInCollection, type);
				}
			}
		}
	}

	private isPack(toProcess: string[]): boolean | string {
		const cardLogs = toProcess
				.map(data => this.cardRegex.exec(data))
				.filter(match => match);
		// console.log('cardLogs', cardLogs, toProcess);
		if (cardLogs.length !== 5) {
			return false;
		}
		const setIds: string[] = cardLogs
				.map(match => match[1])
				.map(cardId => this.cards.getCard(cardId))
				.map(card => card.set);
		const uniqueSetIds = new Set(setIds);
		// console.log('uniqueSetIds', uniqueSetIds);
		if (uniqueSetIds.size !== 1) {
			return false;
		}
		return uniqueSetIds.values().next().value;
	}

	private isTooSoon(logLine: any[]) {
		let match = this.timestampRegex.exec(logLine[1]);
		if (match) {
			let elapsed = Date.now() - parseInt(logLine[0]);
			console.log('elapsed', elapsed, Date.now(), logLine);
			if (elapsed < 100) {
				return true;
			}
		}
		return false;
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
		setTimeout(() => this.events.broadcast(Events.NEW_CARD, card, type), 20);
		ga('send', 'event', 'toast', 'new-card', card.id);
	}

	private displayDustMessage(card: Card, type: string) {
		let dbCard = parseCardsText.getCard(card.id);
		let dust = this.dustFor(dbCard.rarity.toLowerCase());
		dust = type == 'GOLDEN' ? dust * 4 : dust;
		setTimeout(() => this.events.broadcast(Events.MORE_DUST, card, dust, type), 20);
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
