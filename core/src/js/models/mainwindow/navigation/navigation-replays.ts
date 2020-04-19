import { CurrentViewType } from '../replays/current-view.type';
import { MatchDetail } from '../replays/match-detail';

export class NavigationReplays {
	readonly currentView: CurrentViewType = 'list';
	readonly selectedReplay: MatchDetail;

	public update(base: NavigationReplays): NavigationReplays {
		return Object.assign(new NavigationReplays(), this, base);
	}
}
