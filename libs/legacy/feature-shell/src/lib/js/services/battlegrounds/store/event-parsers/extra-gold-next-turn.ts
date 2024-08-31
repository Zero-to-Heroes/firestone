import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsExtraGoldNextTurnEvent extends BattlegroundsStoreEvent {
	constructor(
		public readonly gold: number,
		public readonly overconfidences: number,
		public readonly boardAndEnchantments: readonly (string | number)[],
	) {
		super('BgsExtraGoldNextTurnEvent');
	}
}

export class BgsExtraGoldNextTurnParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsExtraGoldNextTurnEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsExtraGoldNextTurnEvent,
		gameState?: GameState,
	): Promise<BattlegroundsState> {
		return currentState.update({
			currentGame: currentState.currentGame.update({
				extraGoldNextTurn: event.gold,
				overconfidences: event.overconfidences,
				boardAndEnchantments: event.boardAndEnchantments,
			}),
		});
	}
}
