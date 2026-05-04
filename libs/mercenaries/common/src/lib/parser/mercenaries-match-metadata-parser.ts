import { isMercenaries } from '@firestone-hs/reference-data';
import { GameEvent } from '@firestone/game-state';
import { MercenariesBattleState } from '../services/mercenaries-battle-state';
import { MercenariesMemoryCacheService } from '../services/mercenaries-memory-cache.service';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesMatchMetadataParser implements MercenariesParser {
	constructor(private readonly mercenariesMemoryCache: MercenariesMemoryCacheService) {}

	public eventType = () => GameEvent.MATCH_METADATA;

	public applies = (battleState: MercenariesBattleState) => true;

	public async parse(battleState: MercenariesBattleState, event: GameEvent): Promise<MercenariesBattleState> {
		if (!isMercenaries(event.additionalData.metaData.GameType)) {
			return battleState;
		}

		await this.mercenariesMemoryCache.isReady();
		const mercsInfo = await this.mercenariesMemoryCache.memoryMapInfo$$.getValueWithInit();
		return MercenariesBattleState.create({
			spectating: event.additionalData.spectating,
			gameMode: event.additionalData.metaData.GameType,
			mercenariesFromMemory: mercsInfo,
		} as MercenariesBattleState);
	}
}
