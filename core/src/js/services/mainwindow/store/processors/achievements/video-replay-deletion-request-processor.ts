import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { AchievementsLocalStorageService } from '../../../../achievement/achievements-local-storage.service';
import { OverwolfService } from '../../../../overwolf.service';
import { VideoReplayDeletionRequestEvent } from '../../events/achievements/video-replay-deletion-request-event';
import { AchievementUpdateHelper } from '../../helper/achievement-update-helper';
import { Processor } from '../processor';

export class VideoReplayDeletionRequestProcessor implements Processor {
	constructor(
		private ow: OverwolfService,
		private helper: AchievementUpdateHelper,
		private achievementsStorage: AchievementsLocalStorageService,
	) {}

	public async process(
		event: VideoReplayDeletionRequestEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const result: boolean = await this.ow.deleteFile(event.videoPath);
		if (!result) {
			return [null, null];
		}
		await this.achievementsStorage.removeReplay(event.stepId, event.videoPath);
		const newState = await this.helper.rebuildAchievements(currentState, navigationState);
		return [
			Object.assign(new MainWindowState(), currentState, {
				achievements: newState,
			}),
			null,
		];
	}
}
