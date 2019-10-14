import { Processor } from '../processor';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { TriggerSocialNetworkLoginToggleEvent } from '../../events/social/trigger-social-network-login-toggle-event';

declare var overwolf;

export class TriggerSocialNetworkLoginToggleProcessor implements Processor {
	public async process(
		event: TriggerSocialNetworkLoginToggleEvent,
		currentState: MainWindowState,
	): Promise<MainWindowState> {
		if (event.network === 'twitter') {
			const twitter = currentState.socialShareUserInfo.twitter;
			if (twitter.id) {
				overwolf.social.twitter.performLogout(result => console.log('logged out of twitter', result));
			} else {
				overwolf.social.twitter.performUserLogin();
			}
		}
		return currentState;
	}
}
