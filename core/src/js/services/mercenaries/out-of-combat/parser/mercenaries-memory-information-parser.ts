import { SceneMode } from '@firestone-hs/reference-data';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { MemoryMercenariesCollectionInfo } from '../../../../models/memory/memory-mercenaries-collection-info';
import { MemoryUpdate } from '../../../../models/memory/memory-update';
import { MercenariesOutOfCombatState } from '../../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { BroadcastEvent, Events } from '../../../events.service';
import { MemoryInspectionService } from '../../../plugins/memory-inspection.service';
import { sleep } from '../../../utils';
import { MercenariesOutOfCombatParser } from './_mercenaries-out-of-combat-parser';

export const SCENE_WITH_RELEVANT_MERC_INFO = [
	SceneMode.GAMEPLAY,
	SceneMode.LETTUCE_BOUNTY_BOARD,
	SceneMode.LETTUCE_BOUNTY_TEAM_SELECT,
	SceneMode.LETTUCE_COLLECTION,
	SceneMode.LETTUCE_COOP,
	SceneMode.LETTUCE_FRIENDLY,
	SceneMode.LETTUCE_MAP,
	SceneMode.LETTUCE_PACK_OPENING,
	SceneMode.LETTUCE_PLAY,
	SceneMode.LETTUCE_VILLAGE,
];

export class MercenariesMemoryInformationParser implements MercenariesOutOfCombatParser {
	constructor(private readonly memoryService: MemoryInspectionService) {}

	public eventType = () => Events.MEMORY_UPDATE;

	public applies = (state: MercenariesOutOfCombatState) => !!state;

	async parse(
		state: MercenariesOutOfCombatState,
		event: BroadcastEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesOutOfCombatState> {
		const changes: MemoryUpdate = event.data[0];
		const newScene = changes.CurrentScene;
		const stateWithScene = state.update({ currentScene: newScene ?? state.currentScene });
		if (!SCENE_WITH_RELEVANT_MERC_INFO.includes(newScene)) {
			return stateWithScene;
		}
		// Wait for bit before getting the info, as the first time you enter a map you can still have
		// the previous run's info
		console.debug('[merc-ooc] changing scene, refreshing merc info', newScene, SceneMode[newScene]);
		await sleep(2000);
		console.debug('[merc-ooc] done waiting');
		const newMercenariesInfo = await this.memoryService.getMercenariesInfo();
		const collectionInfo: MemoryMercenariesCollectionInfo = await this.memoryService.getMercenariesCollectionInfo();
		console.debug('[merc-ooc] new merc info', newMercenariesInfo);
		return stateWithScene.update({
			mercenariesMemoryInfo: newMercenariesInfo,
			visitorsInfo: collectionInfo?.Visitors,
		});
	}
}
