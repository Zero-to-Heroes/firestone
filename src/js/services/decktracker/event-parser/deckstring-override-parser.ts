import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { HeroCard } from '../../../models/decktracker/hero-card';
import { GameEvent } from '../../../models/game-event';
import { AllCardsService } from '../../all-cards.service';
import { DeckParserService } from '../deck-parser.service';
import { DeckEvents } from './deck-events';
import { EventParser } from './event-parser';

export class DeckstringOverrideParser implements EventParser {
	constructor(private readonly deckParser: DeckParserService, private readonly allCards: AllCardsService) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === 'DECKSTRING_OVERRIDE';
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		console.log('overriding deckstring', gameEvent);
		const formattedData = this.formatData(gameEvent.additionalData.clipboardContent);
		if (!formattedData) {
			console.log('no new deckstring to import, returning', gameEvent);
			return currentState;
		}
		for (let line of formattedData) {
			await this.deckParser.parseActiveDeck(line);
		}
		const currentDeck = await this.deckParser.getCurrentDeck();
		if (!currentDeck || !currentDeck.deckstring || currentDeck.deckstring === currentState.playerDeck.deckstring) {
			console.log('no new deckstring to import, returning', gameEvent, currentDeck);
			return currentState;
		}
		console.log('retrieved current deck', currentDeck);
		const deckList: readonly DeckCard[] = this.buildDeckList(currentDeck);
		const hero: HeroCard = this.buildHero(currentDeck);
		// Remove the cards that are not in deck anymore, i.e. the cards that are in the other zones
		// It's not 100% accurate, but probably as good as we can do it without replaying all the match
		let deck: DeckCard[] = [...deckList];
		const allOtherZoneCards = [
			...currentState.playerDeck.board,
			...currentState.playerDeck.hand,
			...currentState.playerDeck.otherZone,
		].map(card => card.cardId);
		for (let card of allOtherZoneCards) {
			// https://stackoverflow.com/questions/53534721/find-and-remove-first-matching-element-in-an-array-of-javascript-objects
			deck.find((o, i) => {
				if (o.cardId === card) {
					deck.splice(i, 1);
					return true;
				}
				return false;
			});
		}
		console.log('updated deck contents', deck, allOtherZoneCards);
		const playerDeck = Object.assign(new DeckState(), currentState.playerDeck, {
			deckstring: currentDeck.deckstring,
			name: currentDeck.name,
			hero: hero,
			deckList: deckList,
			deck: [...deck] as readonly DeckCard[],
		} as DeckState);
		console.log('new player deck', playerDeck);
		return Object.assign(new GameState(), currentState, {
			playerDeck: playerDeck,
		} as GameState);
	}

	event(): string {
		return DeckEvents.CARD_ID_ASSIGNED;
	}

	private buildHero(currentDeck: any): HeroCard {
		if (!currentDeck || !currentDeck.deck || !currentDeck.deck.heroes || currentDeck.deck.heroes.length === 0) {
			return null;
		}
		return currentDeck.deck.heroes
			.map(hero => this.allCards.getCardFromDbfId(hero))
			.map(heroCard => {
				if (!heroCard) {
					console.error(
						'could not map empty hero card',
						currentDeck.deck.heroes,
						currentDeck.deck,
						currentDeck,
					);
				}
				return heroCard;
			})
			.map(heroCard =>
				Object.assign(new HeroCard(), {
					cardId: heroCard.id,
					name: heroCard.name,
				} as HeroCard),
			)[0];
	}

	private buildDeckList(currentDeck: any): readonly DeckCard[] {
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

	private buildDeckCards(pair): DeckCard[] {
		const card = this.allCards.getCardFromDbfId(pair[0]);
		const result: DeckCard[] = [];
		if (!card) {
			console.error('Could not build deck card', pair);
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

	private formatData(deckstringFromClipboard: string): string[] {
		if (!deckstringFromClipboard) {
			console.log('invalid string from clipboard)', deckstringFromClipboard);
			return null;
		}
		const lines = deckstringFromClipboard.split('\n');
		// console.log('lines', lines);
		const name = lines[0].split('### ') ? lines[0].split('### ')[1] : '';
		const deckstring = lines
			.map(line => new RegExp('^([a-zA-Z0-9\\/\\+=]+)').exec(line))
			.filter(match => match)
			.map(match => match[1])[0];
		// console.log(
		// 	'parsed clipboard content',
		// 	name,
		// 	deckstring,
		// 	lines.map(line => new RegExp('^([a-zA-Z0-9\\/\\+=]+)').exec(line)),
		// );
		if (!deckstring) {
			return null;
		}
		const result = [`I 00:00:00.000000 ### ${name}`, `I 00:00:00.000000 ${deckstring}`];
		// console.log('returning', result);
		return result;
	}
}
