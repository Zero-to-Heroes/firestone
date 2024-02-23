import { BattlegroundsState } from '@firestone/battlegrounds/common';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsExtraGoldNextTurnEvent extends BattlegroundsStoreEvent {
	constructor(public readonly gold: number, public readonly overconfidences: number) {
		super('BgsExtraGoldNextTurnEvent');
	}
}

export class BgsExtraGoldNextTurnParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsExtraGoldNextTurnEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsExtraGoldNextTurnEvent,
	): Promise<BattlegroundsState> {
		return currentState.update({
			currentGame: currentState.currentGame.update({
				extraGoldNextTurn: event.gold,
				overconfidences: event.overconfidences,
			}),
		});
	}
}
