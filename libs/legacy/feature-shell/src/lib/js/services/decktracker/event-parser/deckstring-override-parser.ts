import { DeckCard, DeckHandlerService, DeckSideboard, DeckState, GameEvent, GameState } from '@firestone/game-state';
import { DeckstringOverrideEvent } from '../event/deckstring-override-event';
import { EventParser } from './_event-parser';

export class DeckstringOverrideParser implements EventParser {
	constructor(private readonly deckHandler: DeckHandlerService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: DeckstringOverrideEvent): Promise<GameState> {
		const deckName = gameEvent.deckName;
		const deckstring = gameEvent.deckstring;
		const playerOrOpponent = gameEvent.playerOrOpponent;
		const initialDeck = playerOrOpponent === 'opponent' ? currentState.opponentDeck : currentState.playerDeck;

		if (!deckstring) {
			console.warn('[deckstring-override-parser] no deckstring passed, returning', gameEvent);
			return currentState;
		}

		console.log('[deckstring-override-parser] overriding with deckstring', playerOrOpponent, deckstring);
		// We take the contents of the current deck, and we put aside all the cards that have
		// been added afterwards (ie cards that have a creator)
		// These are the cards that we will have to put back in the deck after the decklist
		// has been overridden
		const deckInfo = initialDeck.deck;
		const cardsNotInInitialDeck = deckInfo.filter((card) => card.creatorCardId);

		// Now we do the opposite: on all the other zones, we need to find out the cards
		// that were part of the initial deck and are not in the "deck" zone anymore
		const cardsMovedOutOfInitialDeck = [...initialDeck.board, ...initialDeck.hand, ...initialDeck.otherZone]
			.filter((card) => card.cardId)
			.filter((card) => !card.creatorCardId);

		const sideboards: readonly DeckSideboard[] = this.deckHandler.buildSideboards(deckstring);
		const cardsFromDeckstring = await this.deckHandler.postProcessDeck(
			this.deckHandler.buildDeckList(deckstring),
			null,
		);

		// Now remove the from this list the cards that were moved out of the initial deck
		const newDeckContents = [...cardsFromDeckstring];
		for (const movedOut of cardsMovedOutOfInitialDeck) {
			const index = newDeckContents.map((card) => card.cardId).indexOf(movedOut.cardId);
			if (index !== -1) {
				newDeckContents.splice(index, 1);
			}
		}

		// And add back the other cards
		const finalDeckContents = [...newDeckContents, ...cardsNotInInitialDeck];

		const newDeck = Object.assign(new DeckState(), initialDeck, {
			deckstring: deckstring,
			name: deckName,
			deckList: cardsFromDeckstring,
			sideboards: sideboards,
			deck: finalDeckContents as readonly DeckCard[],
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[playerOrOpponent === 'opponent' ? 'opponentDeck' : 'playerDeck']: newDeck,
		});
	}

	event(): string {
		return GameEvent.DECKSTRING_OVERRIDE;
	}
}
