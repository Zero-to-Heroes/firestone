import { GameEvent } from '../../../models/game-event';
import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesTurnStartParser implements MercenariesParser {
	public eventType = () => GameEvent.TURN_START;

	public applies = (battleState: MercenariesBattleState) => !!battleState;

	public async parse(battleState: MercenariesBattleState, event: GameEvent): Promise<MercenariesBattleState> {
		console.debug('[merc-turn-start-parser] new turn', event);
		return battleState.update({
			currentTurn: event.additionalData.turnNumber,
			actionQueue: [],
		});
	}
}
