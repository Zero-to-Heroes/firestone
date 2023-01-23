import { OverwolfService } from '@firestone/shared/framework/core';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ShareVideoOnSocialNetworkEvent } from '../../events/social/share-video-on-social-network-event';
import { Processor } from '../processor';

declare let amplitude;

export class ShareVideoOnSocialNetworkProcessor implements Processor {
	constructor(private ow: OverwolfService) {}

	public async process(
		event: ShareVideoOnSocialNetworkEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		amplitude.getInstance().logEvent('share-video', {
			network: event.network,
		});
		switch (event.network) {
			case 'twitter':
				await this.ow.twitterShare(event.videoPathOnDisk, event.message);
				break;
		}
		const newAchievements = navigationState.navigationAchievements.update({
			sharingAchievement: undefined,
		} as NavigationAchievements);
		return [
			null,
			navigationState.update({
				navigationAchievements: newAchievements,
			} as NavigationState),
		];
	}
}
