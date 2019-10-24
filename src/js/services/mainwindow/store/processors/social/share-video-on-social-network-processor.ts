import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { OverwolfService } from '../../../../overwolf.service';
import { ShareVideoOnSocialNetworkEvent } from '../../events/social/share-video-on-social-network-event';
import { Processor } from '../processor';

declare var amplitude;

export class ShareVideoOnSocialNetworkProcessor implements Processor {
	constructor(private ow: OverwolfService) {}

	public async process(
		event: ShareVideoOnSocialNetworkEvent,
		currentState: MainWindowState,
	): Promise<MainWindowState> {
		amplitude.getInstance().logEvent('share-video', {
			'network': event.network,
		});
		switch (event.network) {
			case 'twitter':
				await this.ow.twitterShare(event.videoPathOnDisk, event.message);
				break;
		}
		const achievementState = Object.assign(new AchievementsState(), currentState.achievements, {
			sharingAchievement: undefined,
		} as AchievementsState);
		return Object.assign(new MainWindowState(), currentState, {
			achievements: achievementState,
		} as MainWindowState);
	}
}
