import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { Navigation } from '../../../../models/mainwindow/navigation';
import { SocialShareUserInfo } from '../../../../models/mainwindow/social-share-user-info';
import { OverwolfService } from '../../../overwolf.service';
import { PreferencesService } from '../../../preferences.service';
import { UserService } from '../../../user.service';
import { PopulateStoreEvent } from '../events/populate-store-event';
import { Processor } from './processor';

export class PopulateStoreProcessor implements Processor {
	constructor(private ow: OverwolfService, private userService: UserService, private prefs: PreferencesService) {}

	public async process(event: PopulateStoreEvent, currentState: MainWindowState): Promise<MainWindowState> {
		console.log('[populate-store] populating store');
		const [socialShareUserInfo, currentUser, prefs] = await Promise.all([
			this.initializeSocialShareUserInfo(currentState.socialShareUserInfo),
			this.userService.getCurrentUser(),
			this.prefs.getPreferences(),
		]);
		console.log(
			'[populate-store] received all remote data',
			!prefs.ftue.hasSeenGlobalFtue ? undefined : currentState.currentApp,
		);
		return Object.assign(new MainWindowState(), currentState, {
			// isVisible: true,
			socialShareUserInfo: socialShareUserInfo,
			currentUser: currentUser,
			showFtue: !prefs.ftue.hasSeenGlobalFtue,
			currentApp: !prefs.ftue.hasSeenGlobalFtue ? undefined : currentState.currentApp,
			navigation: Object.assign(new Navigation(), {
				text: 'Categories',
			} as Navigation),
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
