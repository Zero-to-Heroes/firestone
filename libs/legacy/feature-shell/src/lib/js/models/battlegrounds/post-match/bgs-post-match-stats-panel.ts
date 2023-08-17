import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { Race } from '@firestone-hs/reference-data';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { BgsPanel } from '../bgs-panel';
import { BgsPanelId } from '../bgs-panel-id.type';
import { BgsPlayer } from '../bgs-player';
import { BgsStatsFilterId } from './bgs-stats-filter-id.type';

export class BgsPostMatchStatsPanel implements BgsPanel {
	readonly id: BgsPanelId = 'bgs-post-match-stats';
	readonly name: string;
	readonly icon: string;
	readonly stats: IBgsPostMatchStats;
	readonly newBestUserStats: readonly BgsBestStat[];
	// readonly globalStats: BgsStats;
	readonly player: BgsPlayer;
	readonly tabs: BgsStatsFilterId[];
	readonly numberOfDisplayedTabs: number;
	readonly selectedStats: readonly BgsStatsFilterId[];
	readonly availableTribes: readonly Race[];
	// readonly isComputing: boolean;
	readonly forceOpen: boolean;

	public static create(base: BgsPostMatchStatsPanel): BgsPostMatchStatsPanel {
		return Object.assign(new BgsPostMatchStatsPanel(), base);
	}

	public update(base: BgsPostMatchStatsPanel): BgsPostMatchStatsPanel {
		return Object.assign(new BgsPostMatchStatsPanel(), this, base);
	}
}
