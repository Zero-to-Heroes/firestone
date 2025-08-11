import { Zone } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../../models/game-state';
import { GameEvent } from '../../game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { ActionChainParser } from './_action-chain-parser';

export class DoommaidenParser implements ActionChainParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	appliesOnEvent(): GameEvent['type'] {
		return GameEvent.CARD_PLAYED;
	}

	public async parse(currentState: GameState, events: readonly GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const cardPlayedEvent = reversedEvents.shift();
		const isPlayer = cardPlayedEvent!.controllerId === cardPlayedEvent!.localPlayer.PlayerId;
		// Only useful when the opponent handles this
		if (isPlayer) {
			return currentState;
		}

		const cardStolen = reversedEvents.find((e) => e!.type === GameEvent.CARD_STOLEN);
		if (
			!cardStolen ||
			cardStolen.entityId !== cardPlayedEvent!.entityId ||
			cardStolen.additionalData.zone !== Zone.DECK
		) {
			return currentState;
		}

		// Now remove the stolen card from the deck
		const [newDeck, removedCard] = this.helper.removeSingleCardFromZone(
			currentState.playerDeck.deck,
			cardStolen.cardId,
			null, // We shouldn't know which one got removed
		);
		let additionalKnownCardsInDeck = currentState.playerDeck.additionalKnownCardsInDeck;
		if (!removedCard?.cardId) {
			additionalKnownCardsInDeck = additionalKnownCardsInDeck.filter(
				(c, i) =>
					c !== cardStolen.cardId || currentState.playerDeck.additionalKnownCardsInDeck.indexOf(c) !== i,
			);
		}
		const newDeckState = currentState.playerDeck.update({
			deck: newDeck,
			additionalKnownCardsInDeck: additionalKnownCardsInDeck,
		});
		return currentState.update({
			playerDeck: newDeckState,
		});
	}
}
