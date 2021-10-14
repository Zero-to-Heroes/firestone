import { GameEvent } from '../../../models/game-event';
import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { isMercenaries } from '../mercenaries-utils';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesMatchMetadataParser implements MercenariesParser {
	constructor(private readonly memoryService: MemoryInspectionService) {}

	public eventType = () => GameEvent.MATCH_METADATA;

	public applies = (battleState: MercenariesBattleState) => true;

	public async parse(battleState: MercenariesBattleState, event: GameEvent): Promise<MercenariesBattleState> {
		if (!isMercenaries(event.additionalData.metaData.GameType)) {
			return null;
		}

		const mercenariesFromMemory = await this.memoryService.getMercenariesInfo();
		return MercenariesBattleState.create({
			spectating: event.additionalData.spectating,
			mercenariesFromMemory: mercenariesFromMemory,
		} as MercenariesBattleState);
	}
}
