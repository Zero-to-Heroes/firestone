import { GameEvent } from '../../../models/game-event';
import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { isMercenaries } from '../mercenaries-utils';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesMatchMetadataParser implements MercenariesParser {
	public eventType = () => GameEvent.MATCH_METADATA;

	public applies = (battleState: MercenariesBattleState) => true;

	public parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
	): MercenariesBattleState | PromiseLike<MercenariesBattleState> {
		if (!isMercenaries(event.additionalData.metaData.GameType)) {
			return null;
		}
		return MercenariesBattleState.create({
			spectating: event.additionalData.spectating,
		} as MercenariesBattleState);
	}
}
