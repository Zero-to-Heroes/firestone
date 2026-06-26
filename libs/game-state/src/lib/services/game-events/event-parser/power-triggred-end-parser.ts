import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { hasPowerEnd } from '../../cards/_card.type';
import { cardsInfoCache } from '../../cards/_mapping';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class PowerTriggeredEndParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const cardImpl = cardsInfoCache[cardId];
		if (hasPowerEnd(cardImpl)) {
			return cardImpl.powerEnd({
				currentState,
				gameEvent,
				allCards: this.allCards.getService(),
			});
		}

		return currentState;
	}

	event(): string {
		return GameEvent.POWER_TRIGGERED_END;
	}
}
