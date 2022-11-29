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
		const rewardTrackInfos = await this.memory.getRewardsTrackInfo();
		const rewardTrackInfo: RewardsTrackInfo = rewardTrackInfos?.TrackEntries?.find(
			(track) => track.TrackType === RewardTrackType.GLOBAL,
		);
		const newState = currentState.update({
			quests: currentState.quests.update({
				activeQuests: event.data,
				xpBonus: rewardTrackInfo?.XpBonusPercent,
			}),
		});
		return [newState, null];
	}
}
