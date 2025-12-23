import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { ActionChainParser } from './_action-chain-parser';

export class FuturisticForefatherParser implements ActionChainParser {
	appliesOnEvent(): GameEvent['type'] {
		return GameEvent.SUB_SPELL_START;
	}

	public async parse(currentState: GameState, events: GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const subSpellStartEvent = reversedEvents.shift();
		const entityChoseEvent = reversedEvents.find((e) => e.type === GameEvent.ENTITY_CHOSEN);
		if (
			entityChoseEvent?.additionalData?.context?.creatorEntityId !==
			subSpellStartEvent.additionalData.parentEntityId
		) {
			return currentState;
		}

		if (subSpellStartEvent.additionalData.parentCardId !== CardIds.FuturisticForefather_TIME_041) {
			return currentState;
		}

		const choosingOptionsEvent = reversedEvents.find((e) => e.type === GameEvent.CHOOSING_OPTIONS);
		const otherCards = choosingOptionsEvent?.additionalData?.options
			?.filter((o) => o.EntityId !== entityChoseEvent.entityId)
			.map((c) => c.CardId);
		let opponentDeck = currentState.opponentDeck;
		opponentDeck = opponentDeck.update({
			additionalKnownCardsInHand: [
				...opponentDeck.additionalKnownCardsInHand.filter((c) => c !== entityChoseEvent.cardId),
				entityChoseEvent.cardId,
			],
			additionalKnownCardsInDeck: [
				...opponentDeck.additionalKnownCardsInDeck.filter((c) => !otherCards.includes(c)),
				...otherCards,
			],
		});
		return currentState.update({
			opponentDeck: opponentDeck,
		});
	}
}
