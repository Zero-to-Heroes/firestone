import { MmrPercentile } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsMetaStats } from '@firestone/duels/view';

export interface WebsiteDuelsState {
	loaded: boolean;
	error?: string | null;

	stats?: readonly DuelsMetaStats[];
	lastUpdateDate?: Date;
	mmrPercentiles?: readonly MmrPercentile[];
}
