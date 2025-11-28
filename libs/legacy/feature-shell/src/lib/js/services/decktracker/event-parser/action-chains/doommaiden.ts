import { CardIds, Zone } from '@firestone-hs/reference-data';
import { DeckCard, GameState } from '@firestone/game-state';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { ActionChainParser } from './_action-chain-parser';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { CardsFacadeService } from '@firestone/shared/framework/core';

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
		const isPlayer = cardPlayedEvent.controllerId === cardPlayedEvent.localPlayer.PlayerId;
		// Only useful when the opponent handles this
		if (isPlayer) {
			return currentState;
		}

		const cardStolen = reversedEvents.find((e) => e.type === GameEvent.CARD_STOLEN);
		if (
			!cardStolen ||
			cardStolen.entityId !== cardPlayedEvent.entityId ||
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
		const newDeckState = currentState.playerDeck.update({
			deck: newDeck,
		});
		return currentState.update({
			playerDeck: newDeckState,
		});
	}
}
