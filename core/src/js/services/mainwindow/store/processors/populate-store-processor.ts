import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { SocialShareUserInfo } from '../../../../models/mainwindow/social-share-user-info';
import { OverwolfService } from '../../../overwolf.service';
import { PreferencesService } from '../../../preferences.service';
import { UserService } from '../../../user.service';
import { PopulateStoreEvent } from '../events/populate-store-event';
import { Processor } from './processor';

export class PopulateStoreProcessor implements Processor {
	constructor(private ow: OverwolfService, private userService: UserService, private prefs: PreferencesService) {}

	public async process(
		event: PopulateStoreEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.log('[populate-store] populating store');
		const [socialShareUserInfo, currentUser, prefs] = await Promise.all([
			this.initializeSocialShareUserInfo(currentState.socialShareUserInfo),
			this.userService.getCurrentUser(),
			this.prefs.getPreferences(),
		]);
		// console.log(
		// 	'[populate-store] received all remote data',
		// 	!prefs.ftue.hasSeenGlobalFtue ? undefined : currentState.currentApp,
		// );
		return [
			Object.assign(new MainWindowState(), currentState, {
				// isVisible: true,
				socialShareUserInfo: socialShareUserInfo,
				currentUser: currentUser,
				showFtue: !prefs.ftue.hasSeenGlobalFtue,
			} as MainWindowState),
			navigationState.update({
				currentApp: !prefs.ftue.hasSeenGlobalFtue ? undefined : navigationState.currentApp,
				text: 'Categories',
			} as NavigationState),
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
