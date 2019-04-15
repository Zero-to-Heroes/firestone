import { Injectable } from '@angular/core';

import { Card } from '../../models/card';
import { AllCardsService } from '../all-cards.service';
import { Events } from '../events.service';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { NewPackEvent } from '../mainwindow/store/events/collection/new-pack-event';
import { NewCardEvent } from '../mainwindow/store/events/collection/new-card-event';

declare var OverwolfPlugin: any;
declare var overwolf: any;
declare var parseCardsText: any;
declare var ga: any;

@Injectable()
export class LogParserService {
	plugin: any;

	private cardRegex = new RegExp('D (?:\\d*):(?:\\d*):(?:\\d*).(?:\\d*) NotifyOfCardGained: \\[.* cardId=(.*) .*\\] (.*) (\\d).*');
	private rewardRegex = new RegExp('D (?:\\d*):(?:\\d*):(?:\\d*).(?:\\d*) (?:.*)CardRewardData:.* CardID=(.*), Premium=(.*) Count=(\\d).*');
	private timestampRegex = new RegExp('D (\\d*):(\\d*):(\\d*).(\\d*) .*');

	private logLines: any[][] = [];
	private processingLines = false;

	constructor(private cards: AllCardsService, private events: Events, private store: MainWindowStoreService) {
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
		let match = this.cardRegex.exec(data) || this.rewardRegex.exec(data);
		if (match) {
			this.logLines.push([Date.now(), data]);
		}
	}

	private processLines(toProcess: string[]) {
		// Are we opening a pack?
		// console.log('processing lines', toProcess);
		const cards = this.extractCards(toProcess);
		if (this.isPack(cards)) {
			const setId = cards[0].set;
			const packCards = this.toPackCards(toProcess);
			console.log('notifying new pack opening', setId, packCards);
			ga('send', 'event', 'toast', 'new-pack');
			this.events.broadcast(Events.NEW_PACK, setId.toLowerCase(), packCards);
			this.store.stateUpdater.next(new NewPackEvent(setId.toLowerCase(), packCards));
		}

		for (let data of toProcess) {
			// console.log('considering log line', data);
			let match = this.cardRegex.exec(data);
			let multipleCopies = false;
			if (!match) {
				match = this.rewardRegex.exec(data);
				multipleCopies = true;
			}
			if (match) {
				let cardId = match[1];
				let type = match[2];
				let newCount = parseInt(match[3]);
				// console.log('card in collection?', cardId, type, cardInCollection);
				if (multipleCopies) {
					for (let i = 0; i < newCount; i++) {
						this.handleNotification(cardId, type, i + 1);
					}
					return;
				}
				this.handleNotification(cardId, type, newCount);
			}
		}
	}

	private handleNotification(cardId, type, count) {
		let normalCount: number = type === 'NORMAL' ? count : -1;
		let premiumCount: number = type === 'GOLDEN' ? count : -1;
		let cardInCollection = new Card(cardId, normalCount, premiumCount);
		if (!this.hasReachedMaxCollectibleOf(cardInCollection, type)) {
			this.displayNewCardMessage(cardInCollection, type);
		}
		else {
			this.displayDustMessage(cardInCollection, type);
		}
		this.store.stateUpdater.next(new NewCardEvent(cardInCollection, type));
	}

	private toPackCards(toProcess: string[]): any[] {
		return toProcess
				.map(data => this.cardRegex.exec(data))
				.filter(match => match)
				.map((match) => ({
					cardId: match[1],
					cardType: match[2]
				}));
	}

	private extractCards(toProcess: string[]): any[] {
		return toProcess
				.map(data => this.cardRegex.exec(data) || this.rewardRegex.exec(data))
				.filter(match => match)
				.map(match => match[1])
				.map(cardId => this.cards.getCard(cardId));
	}

	private isPack(cards: any[]): boolean {
		if (cards.length !== 5) {
			return false;
		}
		const setIds: string[] = cards.map(card => card.set);
		const uniqueSetIds = new Set(setIds);
		return uniqueSetIds.size === 1;
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
		setTimeout(() => {
			this.events.broadcast(Events.NEW_CARD, card, type);
		}, 20);
		ga('send', 'event', 'toast', 'new-card', card.id);
	}

	private displayDustMessage(card: Card, type: string) {
		let dbCard = parseCardsText.getCard(card.id);
		let dust = this.dustFor(dbCard.rarity.toLowerCase());
		dust = type == 'GOLDEN' ? dust * 4 : dust;
		setTimeout(() => {
			this.events.broadcast(Events.MORE_DUST, card, dust, type);
		}, 20);
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
