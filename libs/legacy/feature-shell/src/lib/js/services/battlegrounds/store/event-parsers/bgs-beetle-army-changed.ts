import { BattlegroundsState } from '@firestone/game-state';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBeetleArmyChangedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsBeetleArmyChangedEvent' as const;
	constructor(public readonly attack: number, public readonly health: number) {
		super('BgsBeetleArmyChangedEvent');
	}
}

export class BgsBeetleArmyChangedParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsBeetleArmyChangedEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsBeetleArmyChangedEvent,
	): Promise<BattlegroundsState> {
		return currentState.update({
			currentGame: currentState.currentGame.update({
				beetlesAttackBuff: event.attack,
				beetlesHealthBuff: event.health,
			}),
		});
	}
}
