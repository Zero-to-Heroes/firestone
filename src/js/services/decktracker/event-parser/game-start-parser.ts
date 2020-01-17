import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { HeroCard } from '../../../models/decktracker/hero-card';
import { GameEvent } from '../../../models/game-event';
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
		const deckList: readonly DeckCard[] = this.deckParser.buildDeckList(currentDeck.deckstring);
		const opponentDeck: readonly DeckCard[] = this.deckParser.buildEmptyDeckList();
		const hero: HeroCard = this.buildHero(currentDeck);
		return Object.assign(new GameState(), {
			gameStarted: true,
			playerDeck: DeckState.create({
				deckstring: currentDeck ? currentDeck.deckstring : null,
				name: currentDeck ? currentDeck.name : null,
				hero: hero,
				deckList: deckList,
				deck: deckList,
				isFirstPlayer: false,
			} as DeckState),
			opponentDeck: DeckState.create({
				deck: opponentDeck,
				isFirstPlayer: false,
				isOpponent: true,
			} as DeckState),
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
}
