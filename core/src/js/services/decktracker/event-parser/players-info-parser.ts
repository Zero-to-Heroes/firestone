import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { HeroCard } from '../../../models/decktracker/hero-card';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class PlayersInfoParser implements EventParser {
	constructor() {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.PLAYERS_INFO;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const newHero = Object.assign(new HeroCard(), currentState.opponentDeck.hero, {
			playerName: gameEvent.additionalData.opponentInfo?.name ?? currentState.opponentDeck.hero?.name,
		} as HeroCard);
		const newOpponentDeck = currentState.opponentDeck.update({
			hero: newHero,
		} as DeckState);
		return currentState.update({
			opponentDeck: newOpponentDeck,
		} as GameState);
	}

	event(): string {
		return GameEvent.PLAYERS_INFO;
	}
}
