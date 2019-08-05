import { MainWindowStoreEvent } from '../main-window-store-event';
import { ReplayInfo } from '../../../../../models/replay-info';

export class AchievementRecordedEvent implements MainWindowStoreEvent {
	constructor(achievementId: string, replayInfo: ReplayInfo) {
		this.achievementId = achievementId;
		this.replayInfo = replayInfo;
	}
	readonly achievementId: string;
	readonly replayInfo: ReplayInfo;

	public static eventName(): string {
		return 'AchievementRecordedEvent';
	}

	public eventName(): string {
		return 'AchievementRecordedEvent';
	}
}
