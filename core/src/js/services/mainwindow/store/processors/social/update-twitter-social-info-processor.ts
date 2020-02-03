import { Processor } from '../processor';
import { UpdateTwitterSocialInfoEvent } from '../../events/social/update-twitter-social-info-event';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { OverwolfService } from '../../../../overwolf.service';
import { SocialShareUserInfo } from '../../../../../models/mainwindow/social-share-user-info';

export class UpdateTwitterSocialInfoProcessor implements Processor {
	constructor(private ow: OverwolfService) {}

	public async process(event: UpdateTwitterSocialInfoEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const socialShareUserInfo = await this.initializeSocialShareUserInfo(currentState.socialShareUserInfo);
		return Object.assign(new MainWindowState(), currentState, {
			socialShareUserInfo: socialShareUserInfo,
		} as MainWindowState);
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
