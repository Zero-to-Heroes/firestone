import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState, ShortCardWithTurn } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class PowerTriggeredParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newPowerTriggeredThisMatch: ShortCardWithTurn[] = [
			...deck.powerTriggeredThisMatch,
			{
				cardId: cardId,
				entityId: entityId,
				turn: +currentState.currentTurn,
			},
		];
		const newDeck = deck.update({
			powerTriggeredThisMatch: newPowerTriggeredThisMatch,
		});

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return GameEvent.POWER_TRIGGERED;
	}
}
