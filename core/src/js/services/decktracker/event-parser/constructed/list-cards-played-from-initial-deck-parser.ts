import { CardIds } from '@firestone-hs/reference-data';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class ListCardsPlayedFromInitialDeckParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && [GameEvent.CARD_PLAYED].includes(gameEvent.type);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		if (isPlayer) {
			return currentState;
		}

		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);
		if (
			card.creatorCardId ||
			[
				CardIds.NonCollectible.Neutral.TheCoinBasic,
				CardIds.NonCollectible.Neutral.TheCoinDARKMOON_FAIRE1,
				CardIds.NonCollectible.Neutral.TheCoinDARKMOON_FAIRE2,
			].includes(cardId)
		) {
			return currentState;
		}

		const cardsPlayedFromInitialDeck: readonly string[] = [...deck.cardsPlayedFromInitialDeck, cardId];
		const newPlayerDeck = deck.update({
			cardsPlayedFromInitialDeck: cardsPlayedFromInitialDeck,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'CARD_PLAYED_FROM_INITIAL_DECK';
	}
}
