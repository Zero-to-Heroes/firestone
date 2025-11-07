import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { ActionChainParser } from './_action-chain-parser';

export class FuturisticForefatherParser implements ActionChainParser {
	appliesOnEvent(): GameEvent['type'] {
		return GameEvent.SUB_SPELL_START;
	}

	public async parse(currentState: GameState, events: GameEvent[]): Promise<GameState> {
		const subSpellStartEvent = events[events.length - 1];
		if (events[events.length - 2]?.type !== GameEvent.ENTITY_CHOSEN) {
			return currentState;
		}

		const entityChoseEvent = events[events.length - 2];
		if (
			entityChoseEvent.additionalData.context.creatorEntityId !== subSpellStartEvent.additionalData.parentEntityId
		) {
			return currentState;
		}

		if (subSpellStartEvent.additionalData.parentCardId !== CardIds.FuturisticForefather_TIME_041) {
			return currentState;
		}

		let opponentDeck = currentState.opponentDeck;
		opponentDeck = opponentDeck.update({
			additionalKnownCardsInHand: [...opponentDeck.additionalKnownCardsInHand, entityChoseEvent.cardId],
		});
		return currentState.update({
			opponentDeck: opponentDeck,
		});
	}
}
