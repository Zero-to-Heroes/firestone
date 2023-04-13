import { MmrPercentile } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsTimeFilterType, DuelsTreasureStatTypeFilterType } from '@firestone/duels/data-access';
import { DuelsMetaStats } from '@firestone/duels/view';

export interface WebsiteDuelsState {
	loaded: boolean;
	error?: string | null;

	heroStats?: readonly DuelsMetaStats[];
	heroPowerStats?: readonly DuelsMetaStats[];
	signatureTreasureStats?: readonly DuelsMetaStats[];
	activeTreasureStats?: readonly DuelsMetaStats[];
	passiveTreasureStats?: readonly DuelsMetaStats[];
	lastUpdateDate?: Date;
	mmrPercentiles?: readonly MmrPercentile[];

	currentPassiveTreasureTypeSelection: DuelsTreasureStatTypeFilterType;
	currentActiveTreasureTypeSelection: DuelsTreasureStatTypeFilterType;
	currentPercentileSelection: MmrPercentile['percentile'];
	currentTimePeriodSelection: DuelsTimeFilterType;
}
