import { BgsStatsFilterId } from '@firestone/battlegrounds/core';
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

	public getPageName(): string {
		return this.selectedTab;
	}
}

export type ReplaysTab = 'replay' | 'match-stats';
