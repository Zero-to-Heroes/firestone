import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsMagnetizedChangedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsMagnetizedChangedEvent' as const;
	constructor(public readonly newValue: number) {
		super('BgsMagnetizedChangedEvent');
	}
}

export class BgsMagnetizedChangedParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsMagnetizedChangedEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsMagnetizedChangedEvent,
	): Promise<BattlegroundsState> {
		return currentState.update({
			currentGame: currentState.currentGame.update({
				magnetized: event.newValue,
			}),
		});
	}
}
