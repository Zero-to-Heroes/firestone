import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../../models/game-state';
import { GameEvent } from '../../game-event';
import { ActionChainParser } from './_action-chain-parser';

export class FuturisticForefatherParser implements ActionChainParser {
	appliesOnEvent(): GameEvent['type'] {
		return GameEvent.SPECIAL_TARGET;
	}

	public async parse(currentState: GameState, events: GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const specialTargetEvent = reversedEvents.shift();
		if (specialTargetEvent!.cardId !== CardIds.FuturisticForefather_TIME_041) {
			return currentState;
		}

		const cardId = specialTargetEvent!.additionalData.targetCardId;
		const entityId = specialTargetEvent!.additionalData.targetEntityId;

		const choosingOptionsEvent = reversedEvents.find((e) => e.type === GameEvent.CHOOSING_OPTIONS);
		const otherCards = choosingOptionsEvent?.additionalData?.options
			?.filter((o) => o.EntityId !== entityId)
			.map((c) => c.CardId);
		let opponentDeck = currentState.opponentDeck;
		opponentDeck = opponentDeck.update({
			additionalKnownCardsInHand: [
				...opponentDeck.additionalKnownCardsInHand.filter((c) => c !== cardId),
				cardId,
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
