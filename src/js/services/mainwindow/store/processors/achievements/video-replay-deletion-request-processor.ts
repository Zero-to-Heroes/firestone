import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { AchievementsLocalStorageService } from '../../../../achievement/achievements-local-storage.service';
import { VideoReplayDeletionRequestEvent } from '../../events/achievements/video-replay-deletion-request-event';
import { AchievementUpdateHelper } from '../../helper/achievement-update-helper';
import { Processor } from '../processor';
import { OverwolfService } from '../../../../overwolf.service';

export class VideoReplayDeletionRequestProcessor implements Processor {
	constructor(
		private ow: OverwolfService,
		private helper: AchievementUpdateHelper,
		private achievementsStorage: AchievementsLocalStorageService,
	) {}

	public async process(
		event: VideoReplayDeletionRequestEvent,
		currentState: MainWindowState,
	): Promise<MainWindowState> {
		const result: boolean = await this.ow.deleteFile(event.videoPath);
		if (!result) {
			return currentState;
		}
		await this.achievementsStorage.removeReplay(event.stepId, event.videoPath);
		const newState = await this.helper.rebuildAchievements(currentState);
		return Object.assign(new MainWindowState(), currentState, {
			achievements: newState,
		});
	}
}
