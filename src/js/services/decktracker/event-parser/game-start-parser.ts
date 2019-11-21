import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { HeroCard } from '../../../models/decktracker/hero-card';
import { GameEvent } from '../../../models/game-event';
import { AllCardsService } from '../../all-cards.service';
import { PreferencesService } from '../../preferences.service';
import { DeckParserService } from '../deck-parser.service';
import { DeckEvents } from './deck-events';
import { EventParser } from './event-parser';

export class GameStartParser implements EventParser {
	constructor(
		private deckParser: DeckParserService,
		private prefs: PreferencesService,
		private allCards: AllCardsService,
	) {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.GAME_START;
	}

	async parse(): Promise<GameState> {
		const noDeckMode = (await this.prefs.getPreferences()).decktrackerNoDeckMode;
		if (noDeckMode) {
			console.log('[game-start-parser] no deck mode is active, not loading current deck');
		}
		const currentDeck = noDeckMode ? undefined : await this.deckParser.getCurrentDeck();
		console.log(
			'[game-start-parser] init game with deck',
			currentDeck && currentDeck.deckstring,
			currentDeck && currentDeck.name,
		);
		const deckList: readonly DeckCard[] = this.buildDeckList(currentDeck);
		const hero: HeroCard = this.buildHero(currentDeck);
		return Object.assign(new GameState(), {
			playerDeck: {
				deckstring: currentDeck.deckstring,
				name: currentDeck.name,
				hero: hero,
				deckList: deckList,
				deck: deckList,
				graveyard: [],
				hand: [],
				board: [],
				otherZone: [],
				dynamicZones: [],
				isFirstPlayer: false,
			} as DeckState,
			opponentDeck: {
				deckList: [],
				deck: [],
				graveyard: [],
				hand: [],
				board: [],
				otherZone: [],
				dynamicZones: [],
				isFirstPlayer: false,
			} as DeckState,
		} as GameState);
	}

	event(): string {
		return DeckEvents.GAME_START;
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
				Object.assign(new DeckCard(), {
					cardId: card.id,
					cardName: card.name,
					manaCost: card.cost,
					rarity: card.rarity ? card.rarity.toLowerCase() : null,
				} as DeckCard),
			);
		}
		return result;
	}
}
