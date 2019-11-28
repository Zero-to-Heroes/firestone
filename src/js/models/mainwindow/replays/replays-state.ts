import { CurrentViewType } from './current-view.type';
import { GroupedReplays } from './grouped-replays';
import { MatchDetail } from './match-detail';
import { ReplayInfo } from './replay-info';

export class ReplaysState {
	readonly currentView: CurrentViewType = 'list';
	readonly allReplays: readonly ReplayInfo[];
	readonly groupedReplays: readonly GroupedReplays[];
	readonly groupByCriteria: 'creation-date' = 'creation-date';
	readonly selectedReplay: MatchDetail;
}
