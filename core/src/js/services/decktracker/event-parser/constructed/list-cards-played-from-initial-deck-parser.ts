import { CardIds, getBaseCardId } from '@firestone-hs/reference-data';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class ListCardsPlayedFromInitialDeckParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			state &&
			[GameEvent.CARD_PLAYED, GameEvent.QUEST_PLAYED, GameEvent.QUEST_PLAYED_FROM_DECK].includes(gameEvent.type)
		);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		if (isPlayer) {
			return currentState;
		}

		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const baseCardId = getBaseCardId(cardId);
		const card = this.helper.findCardInZone(deck.hand, baseCardId, entityId);
		if (
			card.creatorCardId ||
			gameEvent.additionalData.creatorCardId ||
			[
				CardIds.TheCoinCore,
				CardIds.TheCoin1,
				CardIds.TheCoin2,
				CardIds.TheCoin3,
				CardIds.TheCoin4,
				CardIds.TheCoin5,
				CardIds.TheCoin6,
				CardIds.TheCoin7,
			].includes(baseCardId as CardIds)
		) {
			return currentState;
		}

		const cardsPlayedFromInitialDeck: readonly { entityId: number; cardId: string }[] = [
			...deck.cardsPlayedFromInitialDeck,
			{
				entityId: entityId,
				cardId: baseCardId,
			},
		];
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
