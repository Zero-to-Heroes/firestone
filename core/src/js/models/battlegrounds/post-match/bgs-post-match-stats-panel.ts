import { BgsBestStat } from '@firestone-hs/compute-bgs-run-stats/dist/model/bgs-best-stat';
import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { FeatureFlags } from '../../../services/feature-flags';
import { BgsPanel } from '../bgs-panel';
import { BgsPanelId } from '../bgs-panel-id.type';
import { BgsPlayer } from '../bgs-player';
import { BgsStats } from '../stats/bgs-stats';
import { BgsStatsFilterId } from './bgs-stats-filter-id.type';

export class BgsPostMatchStatsPanel implements BgsPanel {
	readonly id: BgsPanelId = 'bgs-post-match-stats';
	readonly name: string = FeatureFlags.ENABLE_REAL_TIME_STATS ? 'Live stats' : 'Post-match stats';
	readonly icon: string;
	readonly stats: IBgsPostMatchStats;
	readonly newBestUserStats: readonly BgsBestStat[];
	readonly globalStats: BgsStats;
	readonly player: BgsPlayer;
	readonly tabs: BgsStatsFilterId[];
	readonly numberOfDisplayedTabs: number;
	readonly selectedStats: readonly BgsStatsFilterId[];
	// readonly isComputing: boolean;
	readonly forceOpen: boolean;

	public static create(base: BgsPostMatchStatsPanel): BgsPostMatchStatsPanel {
		return Object.assign(new BgsPostMatchStatsPanel(), base);
	}

	public update(base: BgsPostMatchStatsPanel): BgsPostMatchStatsPanel {
		return Object.assign(new BgsPostMatchStatsPanel(), this, base);
	}
}
