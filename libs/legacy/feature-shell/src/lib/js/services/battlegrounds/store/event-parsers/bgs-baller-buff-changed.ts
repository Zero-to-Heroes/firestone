import { BattlegroundsState } from '@firestone/game-state';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBallerBuffChangedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsBallerBuffChangedEvent' as const;
	constructor(public readonly buff: number) {
		super('BgsBallerBuffChangedEvent');
	}
}

export class BgsBallerBuffChangedParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsBallerBuffChangedEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsBallerBuffChangedEvent,
	): Promise<BattlegroundsState> {
		return currentState.update({
			currentGame: currentState.currentGame.update({
				ballerBuff: event.buff,
			}),
		});
	}
}
