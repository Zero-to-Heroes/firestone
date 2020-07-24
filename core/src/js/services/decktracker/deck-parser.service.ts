import { Injectable } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { decode, encode } from 'deckstrings';
import { DeckCard } from '../../models/decktracker/deck-card';
import { GameEvent } from '../../models/game-event';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { isCharLowerCase } from '../utils';

@Injectable()
export class DeckParserService {
	private readonly goingIntoQueueRegex = new RegExp('D \\d*:\\d*:\\d*.\\d* BeginEffect blur \\d => 1');

	private readonly deckContentsRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* Deck Contents Received(.*)');
	private readonly deckEditOverRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* Finished Editing Deck(.*)');

	private readonly deckNameRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ### (.*)');
	private readonly deckstringRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ([a-zA-Z0-9\\/\\+=]+)$');

	public currentDeck: any = {};
	private previousDeck: any = {};

	private lastDeckTimestamp;
	private currentBlock: string;

	private currentGameType: GameType;
	private currentScenarioId: number;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private memory: MemoryInspectionService,
		private allCards: AllCardsService,
		private events: Events,
	) {
		this.gameEvents.allEvents.subscribe((event: GameEvent) => {
			if (event.type === GameEvent.GAME_END) {
				console.log('[deck-parser] resetting deck after game end');
				this.reset(this.currentGameType === GameType.GT_VS_AI);
				this.currentGameType = undefined;
				this.currentScenarioId = undefined;
			} else if (event.type === GameEvent.MATCH_METADATA) {
				this.currentGameType = event.additionalData.metaData.GameType;
				this.currentScenarioId = event.additionalData.metaData.ScenarioID;
				this.currentDeck.scenarioId = this.currentScenarioId;
				console.log(
					'[deck-parser] setting mleta info',
					this.currentGameType,
					this.currentScenarioId,
					this.currentDeck,
				);
			}
		});
	}

	public async queueingIntoMatch(logLine: string) {
		// console.log('will detect active deck from queue?', logLine);
		if (
			this.currentGameType === GameType.GT_BATTLEGROUNDS ||
			this.currentGameType === GameType.GT_BATTLEGROUNDS_FRIENDLY
		) {
			return;
		}
		if (this.goingIntoQueueRegex.exec(logLine)) {
			console.log('getting active deck from going into queue');
			const activeDeck = await this.memory.getActiveDeck(0);
			//console.log('active deck after queue', activeDeck);
			if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
				console.log(
					'[deck-parser] updating active deck after queue',
					activeDeck,
					this.currentDeck,
					this.currentScenarioId,
				);
				this.currentDeck.deck = { cards: this.explodeDecklist(activeDeck.DeckList) };
				this.currentDeck.scenarioId = this.currentScenarioId;
			}
		}
	}

	public async getCurrentDeck(shouldUsePreviousDeck: boolean, scenarioId: number): Promise<any> {
		console.log(
			'[deck-parser] getting current deck',
			this.currentDeck,
			shouldUsePreviousDeck,
			scenarioId,
			this.previousDeck,
		);
		if (this.currentDeck?.deck) {
			console.log('[deck-parser] returning cached deck', this.currentDeck);
			return this.currentDeck;
		}
		if (
			(!this.currentDeck || !this.currentDeck.deck) &&
			shouldUsePreviousDeck &&
			scenarioId === this.previousDeck.scenarioId
		) {
			console.log('[deck-parser] using previous deck');
			this.currentDeck = this.previousDeck;
		}
		if (this.memory) {
			//console.log('[deck-parser] ready to get active deck', new Error().stack);
			const activeDeck = await this.memory.getActiveDeck(0);
			if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
				console.log('[deck-parser] updating active deck', activeDeck, this.currentDeck);
				this.currentDeck.deck = { cards: this.explodeDecklist(activeDeck.DeckList) };
			}
		}
		console.log('[deck-parser] returning current deck', this.currentDeck);
		return this.currentDeck;
	}

	private explodeDecklist(decklist: string[]): any[] {
		// Can be either a dbfId or a cardId, depending on the situation
		return decklist.map(id => [id, 1]);
	}

	public parseActiveDeck(data: string) {
		let match = this.deckContentsRegex.exec(data);
		if (match) {
			this.lastDeckTimestamp = Date.now();
			this.currentBlock = 'DECK_CONTENTS';
			console.log('[deck-parser] finished listing deck content');
			return;
		}
		match = this.deckEditOverRegex.exec(data);
		if (match) {
			this.lastDeckTimestamp = Date.now();
			this.currentBlock = 'DECK_EDIT_OVER';
			console.log('[deck-parser] finished editing deck');
			return;
		}

		if (
			this.lastDeckTimestamp &&
			Date.now() - this.lastDeckTimestamp < 1000 &&
			this.currentBlock !== 'DECK_SLECTED'
		) {
			console.log('[deck-parser] Doesnt look like a deck selection, exiting block', this.currentBlock);
			// Don't reset the deck here, as it can override a deck built from memory inspection
			// this.reset();
			return;
		}

		console.log('[deck-parser] received log line', data);
		match = this.deckNameRegex.exec(data);
		if (match) {
			// console.log('[deck-parser] matching log line for deck name', data);
			this.currentDeck = {
				name: match[1],
				scenarioId: this.currentScenarioId,
			};
			console.log('[deck-parser] deck init', this.currentDeck);
			return;
		}
		match = this.deckstringRegex.exec(data);
		if (match) {
			console.log('[deck-parser] parsing deckstring', match);
			this.currentDeck = this.currentDeck || {
				scenarioId: this.currentScenarioId,
			};
			this.currentDeck.deckstring = this.normalizeDeckstring(match[1]);
			console.log('[deck-parser] current deck', this.currentDeck);
			this.decodeDeckString();
			console.log('[deck-parser] deckstring decoded', this.currentDeck);
			return;
		}
	}

	public decodeDeckString() {
		if (this.currentDeck) {
			if (this.currentDeck.deckstring) {
				// console.debug('[deck-parser] deck updated', this.currentDeck);
				const deck = decode(this.currentDeck.deckstring);
				this.currentDeck.deck = deck;
				return;
			} else {
				this.currentDeck.deck = undefined;
			}
		}
	}

	// By doing this we make sure we don't get a leftover deckstring caused by
	// a game mode that doesn't interact with the Decks.log
	public reset(shouldStorePreviousDeck: boolean) {
		if (shouldStorePreviousDeck && this.currentDeck?.deck) {
			this.previousDeck = this.currentDeck;
		}
		this.currentDeck = {};
		console.log('[deck-parser] resetting deck', shouldStorePreviousDeck, this.currentDeck, this.previousDeck);
	}

	public buildDeck(currentDeck: any): readonly DeckCard[] {
		if (currentDeck && currentDeck.deckstring) {
			return this.buildDeckList(currentDeck.deckstring);
		}
		if (!currentDeck || !currentDeck.deck) {
			return [];
		}
		return (
			currentDeck.deck.cards
				// [dbfid, count] pair
				.map(pair => this.buildDeckCards(pair))
				.reduce((a, b) => a.concat(b), [])
				.sort((a: DeckCard, b: DeckCard) => a.manaCost - b.manaCost)
		);
	}

	public buildDeckList(deckstring: string, deckSize = 30): readonly DeckCard[] {
		if (!deckstring) {
			return this.buildEmptyDeckList(deckSize);
		}
		const deck = decode(deckstring);
		// console.log('decoding', deckstring, deck);
		return deck
			? deck.cards
					// [dbfid, count] pair
					.map(pair => this.buildDeckCards(pair))
					.reduce((a, b) => a.concat(b), [])
					.sort((a: DeckCard, b: DeckCard) => a.manaCost - b.manaCost)
			: [];
	}

	public buildEmptyDeckList(deckSize = 30): readonly DeckCard[] {
		return new Array(deckSize).fill(DeckCard.create({} as DeckCard));
	}

	public buildDeckCards(pair): DeckCard[] {
		let dbfId = -1;
		try {
			dbfId = parseInt(pair[0]);
		} catch (e) {}
		const card =
			!isNaN(dbfId) && dbfId !== -1 ? this.allCards.getCardFromDbfId(dbfId) : this.allCards.getCard(pair[0]);
		const result: DeckCard[] = [];
		if (!card) {
			console.error('Could not build deck card', dbfId, isNaN(dbfId), dbfId !== -1, pair);
			return result;
		}
		// Don't include passive buffs in the decklist
		if (card.mechanics && card.mechanics.indexOf('DUNGEON_PASSIVE_BUFF') !== -1) {
			return result;
		}
		for (let i = 0; i < pair[1]; i++) {
			result.push(
				DeckCard.create({
					cardId: card.id,
					cardName: card.name,
					manaCost: card.cost,
					rarity: card.rarity ? card.rarity.toLowerCase() : null,
				} as DeckCard),
			);
		}
		return result;
	}

	public normalizeDeckstring(deckstring: string, heroCardId?: string): string {
		try {
			// console.log('normalizing deckstring', deckstring, heroCardId);
			const deck = decode(deckstring);
			// console.log('deck from deckstring', deckstring, deck);
			deck.heroes = deck.heroes?.map(heroDbfId => this.normalizeHero(heroDbfId, heroCardId));
			const newDeckstring = encode(deck);
			// console.log('normalized deck', newDeckstring, deck);
			return newDeckstring;
		} catch (e) {
			if (deckstring) {
				console.warn('trying to normalize invalid deckstring', deckstring, e);
			}
			return deckstring;
		}
	}

	private normalizeHero(heroDbfId: number, heroCardId?: string): number {
		let card: ReferenceCard;
		// console.log('normalizing hero', heroDbfId, heroCardId);
		if (heroDbfId) {
			card = this.allCards.getCardFromDbfId(heroDbfId);
		}
		// console.log('found card for hero', card);
		if (!card || !card.id) {
			// console.log('fallbacking to heroCardId', heroCardId);
			card = this.allCards.getCard(heroCardId);
			if (!card || !card.id) {
				return heroDbfId;
			}
		}
		// This is the case for the non-standard heroes
		if (isCharLowerCase(card.id.charAt(card.id.length - 1))) {
			const canonicalHeroId = card.id.slice(0, -1);
			// console.log('trying to find canonical hero card', card, canonicalHeroId);
			const canonicalCard = this.allCards.getCard(canonicalHeroId);
			if (canonicalCard) {
				return canonicalCard.dbfId;
			}
		}
		return heroDbfId;
	}
}
