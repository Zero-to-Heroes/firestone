import { BattlegroundsState } from '@firestone/game-state';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBloodGemBuffChangedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsBloodGemBuffChangedEvent' as const;
	constructor(public readonly attack: number, public readonly health: number) {
		super('BgsBloodGemBuffChangedEvent');
	}
}

export class BgsBloodGemBuffChangedParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsBloodGemBuffChangedEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsBloodGemBuffChangedEvent,
	): Promise<BattlegroundsState> {
		return currentState.update({
			currentGame: currentState.currentGame.update({
				bloodGemAttackBuff: event.attack,
				bloodGemHealthBuff: event.health,
			}),
		} as BattlegroundsState);
	}
}
