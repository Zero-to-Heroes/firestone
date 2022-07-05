import { GameEvent } from '../../../models/game-event';
import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesGameEndParser implements MercenariesParser {
	public eventType = () => GameEvent.GAME_END;

	public applies = (battleState: MercenariesBattleState) => true;

	public async parse(battleState: MercenariesBattleState, event: GameEvent): Promise<MercenariesBattleState> {
		return null;
	}
}
