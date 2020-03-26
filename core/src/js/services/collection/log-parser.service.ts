import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { Card } from '../../models/card';
import { Events } from '../events.service';
import { NewCardEvent } from '../mainwindow/store/events/collection/new-card-event';
import { NewPackEvent } from '../mainwindow/store/events/collection/new-pack-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { ProcessingQueue } from '../processing-queue.service';

declare let amplitude: any;

@Injectable()
export class LogParserService {
	plugin: any;

	private cardRegex = new RegExp(
		'D (?:\\d*):(?:\\d*):(?:\\d*).(?:\\d*) NotifyOfCardGained: \\[.* cardId=(.*) .*\\] (.*) (\\d+).*',
	);
	private rewardRegex = new RegExp(
		'D (?:\\d*):(?:\\d*):(?:\\d*).(?:\\d*) (?:.*)CardRewardData:.* CardID=(.*), Premium=(.*) Count=(\\d).*',
	);
	private timestampRegex = new RegExp('D (\\d*):(\\d*):(\\d*).(\\d*) .*');

	// Avoid showing the same notif twice
	private cardsNotifiedThisSession = [];

	private processingQueue = new ProcessingQueue<any[]>(
		eventQueue => this.processQueue(eventQueue),
		200,
		'log-parser',
	);

	constructor(private cards: AllCardsService, private events: Events, private store: MainWindowStoreService) {}

	private async processQueue(eventQueue: readonly any[][]): Promise<readonly any[][]> {
		if (eventQueue.length > 0 && this.isTooSoon(eventQueue[eventQueue.length - 1])) {
			// console.log('too soon, waiting before processing');
			return eventQueue;
		}
		const toProcess: string[] = eventQueue.map(logLine => logLine[1]);
		if (toProcess.length > 0) {
			// console.log('[pack-parser] lines to process', toProcess);
			this.processLines(toProcess);
		}
		// We always process all the events
		return [];
	}

	public receiveLogLine(data: string) {
		// console.log('[pack-parser] received log line', data);
		const match = this.cardRegex.exec(data) || this.rewardRegex.exec(data);
		if (match) {
			this.processingQueue.enqueue([Date.now(), data]);
		}
	}

	private processLines(toProcess: string[]) {
		// Are we opening a pack?
		// console.log('[pack-parser] processing lines', toProcess);
		const cards = this.extractCards(toProcess);
		if (this.isPack(cards)) {
			const setId = cards[0].set;
			const packCards = this.toPackCards(toProcess);
			console.log('[pack-parser] notifying new pack opening', setId, packCards);
			amplitude.getInstance().logEvent('new-pack', { 'set': setId });
			this.events.broadcast(Events.NEW_PACK, setId.toLowerCase(), packCards);
			this.store.stateUpdater.next(new NewPackEvent(setId.toLowerCase(), packCards));
		} else {
			console.log('[pack-parser] received cards outside of pack', cards, toProcess);
		}

		for (const data of toProcess) {
			// console.log('considering log line', data);
			let match = this.cardRegex.exec(data);
			let multipleCopies = false;
			if (!match) {
				match = this.rewardRegex.exec(data);
				multipleCopies = true;
			}
			if (match) {
				const cardId = match[1];
				const type = match[2];
				const newCount = parseInt(match[3]);
				const memoryLine = `${cardId.toLowerCase()}-${type.toLowerCase()}-${newCount}`;
				if (this.cardsNotifiedThisSession.indexOf(memoryLine) !== -1) {
					console.log('duplicate cards, returning', memoryLine);
					continue;
				}
				this.cardsNotifiedThisSession.push(memoryLine);
				// console.log('handling new card', cardId, type, newCount, data);
				// console.log('card in collection?', cardId, type, cardInCollection);
				if (multipleCopies) {
					for (let i = 0; i < newCount; i++) {
						this.handleNotification(cardId, type, i + 1);
					}
					continue;
				}
				this.handleNotification(cardId, type, newCount);
			}
		}
	}

	private handleNotification(cardId, type, count) {
		const normalCount: number = type === 'NORMAL' ? count : -1;
		const premiumCount: number = type === 'GOLDEN' ? count : -1;
		const cardInCollection = new Card(cardId, normalCount, premiumCount);
		if (!this.hasReachedMaxCollectibleOf(cardInCollection, type)) {
			// console.log('displaying new cards message', cardInCollection, type);
			this.displayNewCardMessage(cardInCollection, type);
		} else {
			this.displayDustMessage(cardInCollection, type);
		}
		this.store.stateUpdater.next(new NewCardEvent(cardInCollection, type));
	}

	private toPackCards(toProcess: string[]): any[] {
		return toProcess
			.map(data => this.cardRegex.exec(data))
			.filter(match => match)
			.map(match => ({
				cardId: match[1],
				cardType: match[2],
			}));
	}

	private extractCards(toProcess: string[]): any[] {
		return toProcess
			.map(data => this.cardRegex.exec(data) || this.rewardRegex.exec(data))
			.filter(match => match)
			.map(match => match[1])
			.map(cardId => this.cards.getCard(cardId))
			.filter(card => card);
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
		const match = this.timestampRegex.exec(logLine[1]);
		if (match) {
			const elapsed = Date.now() - parseInt(logLine[0]);
			// console.log('elapsed', elapsed, Date.now(), logLine);
			// Because the queue processing is async, it can take more time
			// to process all the events
			if (elapsed < 200) {
				return true;
			}
		}
		return false;
	}

	private hasReachedMaxCollectibleOf(card: Card, type: string): boolean {
		// Card is not in collection at all
		// Should never occur
		if (!card) {
			console.warn(
				'Should never have a missing card in collection, since the collection is retrieved after card pack opening',
			);
			return false;
		}

		const dbCard = this.cards.getCard(card.id);
		if (!dbCard) {
			console.warn('unknown card', card.id, card);
			return false;
		}
		// The collection is updated immediately, so when we query it the new card has already been inserted
		if ((type === 'NORMAL' && dbCard.rarity === 'Legendary' && card.count >= 2) || card.count >= 3) {
			return true;
		}
		if ((type === 'GOLDEN' && dbCard.rarity === 'Legendary' && card.premiumCount >= 2) || card.premiumCount >= 3) {
			return true;
		}
		return false;
	}

	private displayNewCardMessage(card: Card, type: string) {
		console.log('[pack-parser] New card!', card.id, type);
		setTimeout(() => {
			this.events.broadcast(Events.NEW_CARD, card, type);
		}, 20);
		amplitude.getInstance().logEvent('new-card', { 'id': card.id });
	}

	private displayDustMessage(card: Card, type: string) {
		const dbCard = this.cards.getCard(card.id);
		let dust = this.dustFor(dbCard.rarity?.toLowerCase());
		dust = type === 'GOLDEN' ? dust * 4 : dust;
		setTimeout(() => {
			this.events.broadcast(Events.MORE_DUST, card, dust, type);
		}, 20);
		amplitude.getInstance().logEvent('dust', { 'amount': dust });
		console.log('[pack-parser] Got ' + dust + ' dust', card.id, type);
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
