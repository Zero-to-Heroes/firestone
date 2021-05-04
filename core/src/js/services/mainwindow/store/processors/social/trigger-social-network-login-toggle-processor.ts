import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { TriggerSocialNetworkLoginToggleEvent } from '../../events/social/trigger-social-network-login-toggle-event';
import { Processor } from '../processor';

declare let overwolf;

export class TriggerSocialNetworkLoginToggleProcessor implements Processor {
	public async process(
		event: TriggerSocialNetworkLoginToggleEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		if (event.network === 'twitter') {
			const twitter = currentState.socialShareUserInfo.twitter;
			if (twitter.id) {
				overwolf.social.twitter.performLogout((result) => console.log('logged out of twitter', result));
			} else {
				overwolf.social.twitter.performUserLogin();
			}
		}
		return [null, null];
	}
}
