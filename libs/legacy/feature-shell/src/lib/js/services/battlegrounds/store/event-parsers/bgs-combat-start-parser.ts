import { BattlegroundsState, BgsGame } from '@firestone/battlegrounds/core';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsCombatStartEvent } from '../events/bgs-combat-start-event';
import { EventParser } from './_event-parser';

export class BgsCombatStartParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsCombatStartEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsCombatStartEvent): Promise<BattlegroundsState> {
		const newGame = currentState.currentGame.update({
			phase: 'combat',
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
