import { GameEvent } from '@firestone/game-state';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { MercenariesMemoryCacheService } from '@firestone/mercenaries/common';
import { isMercenaries } from '@firestone/mercenaries/common';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesMatchMetadataParser implements MercenariesParser {
	constructor(private readonly mercenariesMemoryCache: MercenariesMemoryCacheService) {}

	public eventType = () => GameEvent.MATCH_METADATA;

	public applies = (battleState: MercenariesBattleState) => true;

	public async parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesBattleState> {
		if (!isMercenaries(event.additionalData.metaData.GameType)) {
			return null;
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
