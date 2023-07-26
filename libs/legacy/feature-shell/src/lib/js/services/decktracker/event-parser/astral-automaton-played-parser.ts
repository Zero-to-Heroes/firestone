import { CardIds } from '@firestone-hs/reference-data';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class AstralAutomatonPlayedParser implements EventParser {
	private static CARD_IDS = [CardIds.AstralAutomaton];

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			state &&
			gameEvent.type === GameEvent.CARD_PLAYED &&
			AstralAutomatonPlayedParser.CARD_IDS.includes(gameEvent.cardId as CardIds)
		);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			astralAutomatonSize: (deck.astralAutomatonSize || 0) + 1,
		} as DeckState);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'ASTRAL_AUTOMATON_PLAYED';
	}
}
