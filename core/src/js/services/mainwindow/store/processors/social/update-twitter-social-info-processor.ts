import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SocialShareUserInfo } from '../../../../../models/mainwindow/social-share-user-info';
import { OverwolfService } from '../../../../overwolf.service';
import { UpdateTwitterSocialInfoEvent } from '../../events/social/update-twitter-social-info-event';
import { Processor } from '../processor';

export class UpdateTwitterSocialInfoProcessor implements Processor {
	constructor(private ow: OverwolfService) {}

	public async process(
		event: UpdateTwitterSocialInfoEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const socialShareUserInfo = await this.initializeSocialShareUserInfo(currentState.socialShareUserInfo);
		return [
			currentState.update({
				socialShareUserInfo: socialShareUserInfo,
			} as MainWindowState),
			null,
		];
	}

	private async initializeSocialShareUserInfo(
		socialShareUserInfo: SocialShareUserInfo,
	): Promise<SocialShareUserInfo> {
		const twitter = await this.ow.getTwitterUserInfo();
		return Object.assign(new SocialShareUserInfo(), socialShareUserInfo, {
			twitter: twitter,
		} as SocialShareUserInfo);
	}
}
