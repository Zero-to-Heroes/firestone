import { GameEvent } from '@firestone/game-state';
import { MercenariesBattleState } from '../services/mercenaries-battle-state';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesTeamOpponentManualCloseParser implements MercenariesParser {
	public eventType = () => 'MANUAL_TEAM_OPPONENT_WIDGET_CLOSE';

	public applies = (battleState: MercenariesBattleState) => true;

	public async parse(battleState: MercenariesBattleState, event: GameEvent): Promise<MercenariesBattleState> {
		return battleState.update({
			opponentClosedManually: true,
		});
	}
}
