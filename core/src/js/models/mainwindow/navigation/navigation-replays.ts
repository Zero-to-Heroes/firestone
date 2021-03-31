import { BgsStatsFilterId } from '../../battlegrounds/post-match/bgs-stats-filter-id.type';
import { CurrentViewType } from '../replays/current-view.type';
import { MatchDetail } from '../replays/match-detail';

export class NavigationReplays {
	readonly currentView: CurrentViewType = 'list';
	readonly selectedReplay: MatchDetail;
	readonly selectedTab: ReplaysTab;
	readonly selectedStatsTabs: readonly BgsStatsFilterId[] = ['hp-by-turn'];
	readonly numberOfDisplayedTabs: number = 1;

	public update(base: NavigationReplays): NavigationReplays {
		return Object.assign(new NavigationReplays(), this, base);
	}
}

export type ReplaysTab = 'replay' | 'match-stats';
