import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, GameState } from '@firestone/game-state';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { ActionChainParser } from './_action-chain-parser';
import { DeckManipulationHelper } from '../deck-manipulation-helper';

export class WaveshapingParser implements ActionChainParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	public async parse(currentState: GameState, events: readonly GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const entityChosenEvent = reversedEvents.shift();
		const isPlayer = entityChosenEvent.controllerId === entityChosenEvent.localPlayer.PlayerId;
		if (!isPlayer) {
			return currentState;
		}

		let choosingOptionsEvent: GameEvent | null = null;
		for (const event of reversedEvents) {
			if (event.type === GameEvent.CHOOSING_OPTIONS) {
				choosingOptionsEvent = event;
				break;
			}
			if (event.type === GameEvent.ENTITY_CHOSEN) {
				break;
			}
		}
		if (!choosingOptionsEvent) {
			return currentState;
		}

		if (choosingOptionsEvent.cardId !== CardIds.Waveshaping_TIME_701) {
			return currentState;
		}

		const cardsGoingBackToBottom = choosingOptionsEvent.additionalData.options.filter(
			(o) => o.EntityId != entityChosenEvent.entityId,
		);
		const playerDeck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		let newDeck = playerDeck.deck;
		for (const card of cardsGoingBackToBottom) {
			const linkedEntityEvent = reversedEvents.find(
				(e) => e.type === GameEvent.LINKED_ENTITY && e.entityId === card.EntityId,
			);
			const originalCardEntityId = linkedEntityEvent?.additionalData.linkedEntityId;
			const found = this.helper.findCardInZone(newDeck, card.cardId, originalCardEntityId);
			if (found) {
				const withBottom = found.update({
					positionFromBottom: DeckCard.deckIndexFromBottom++,
				});
				newDeck = this.helper.empiricReplaceCardInZone(newDeck, withBottom, false);
			}
		}

		const newPlayerDeck = playerDeck.update({
			deck: newDeck,
		});

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}
}
