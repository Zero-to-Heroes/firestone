import { SceneMode } from '@firestone-hs/reference-data';
import { CardPackInfo, PackInfo } from './pack-info';

export interface MemoryUpdate {
	readonly DisplayingAchievementToast: boolean;
	readonly CurrentScene: SceneMode;

	// These are not populated by the regular info updates, as they are costly to compute
	readonly OpenedPack: PackInfo;
	readonly NewCards: readonly CardPackInfo[];
}
