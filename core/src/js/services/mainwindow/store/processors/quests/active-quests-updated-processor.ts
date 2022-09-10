import { RewardTrackType } from '@firestone-hs/reference-data';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { RewardsTrackInfo } from '../../../../../models/rewards-track-info';
import { MemoryInspectionService } from '../../../../plugins/memory-inspection.service';
import { ActiveQuestsUpdatedEvent } from '../../events/quests/active-quests-updated-event';

export class ActiveQuestsUpdatedProcessor implements Processor {
	constructor(private readonly memory: MemoryInspectionService) {}

	public async process(
		event: ActiveQuestsUpdatedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.debug('[quests] loading rewards track infos');
		const rewardTrackInfos = await this.memory.getRewardsTrackInfo();
		console.debug('[quests] loaded rewards track infos', rewardTrackInfos);
		const rewardTrackInfo: RewardsTrackInfo = rewardTrackInfos?.TrackEntries?.find(
			(track) => track.TrackType === RewardTrackType.GLOBAL,
		);
		console.debug('[quests] loaded rewards track info', rewardTrackInfo, event.data);
		const newState = currentState.update({
			quests: currentState.quests.update({
				activeQuests: event.data,
				xpBonus: rewardTrackInfo?.XpBonusPercent,
			}),
		});
		console.debug('[quests] newState', newState);
		return [newState, null];
	}
}
