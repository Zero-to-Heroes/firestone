import { GameEvent } from '../../../models/game-event';
import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesTeamManualCloseParser implements MercenariesParser {
	public eventType = () => 'MANUAL_TEAM_WIDGET_CLOSE';

	public applies = (battleState: MercenariesBattleState) => true;

	public parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
	): MercenariesBattleState | PromiseLike<MercenariesBattleState> {
		return battleState.update({
			closedManually: true,
		});
	}
}
