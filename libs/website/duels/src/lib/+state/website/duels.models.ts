import { MmrPercentile } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsTimeFilterType } from '@firestone/duels/data-access';
import { DuelsMetaStats } from '@firestone/duels/view';

export interface WebsiteDuelsState {
	loaded: boolean;
	error?: string | null;

	heroStats?: readonly DuelsMetaStats[];
	heroPowerStats?: readonly DuelsMetaStats[];
	signatureTreasureStats?: readonly DuelsMetaStats[];
	lastUpdateDate?: Date;
	mmrPercentiles?: readonly MmrPercentile[];

	currentPercentileSelection: MmrPercentile['percentile'];
	currentTimePeriodSelection: DuelsTimeFilterType;
}
