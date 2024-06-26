import { Injectable } from '@angular/core';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { CommunityJoinService } from './community-join.service';
import { CommunityNavigationService } from './community-navigation.service';

@Injectable()
export class CommunityProtocolHandlerService {
	constructor(
		private readonly ow: OverwolfService,
		private readonly communityJoinService: CommunityJoinService,
		private readonly nav: CommunityNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {
		this.init();
	}

	private init() {
		this.ow.addAppLaunchTriggeredListener(async (info) => {
			if (
				info?.origin === 'urlscheme' &&
				decodeURIComponent(info.parameter).startsWith('firestoneapp://guilds/join/')
			) {
				const joinCode = decodeURIComponent(info.parameter).split('firestoneapp://guilds/join/')[1];
				const joinedComunity = await this.communityJoinService.joinCommunity(joinCode);
				if (!!joinedComunity) {
					this.nav.category$$.next('my-communities');
					this.nav.selectedCommunity$$.next(joinedComunity.id);
					this.mainNav.currentApp$$.next('communities');
				}
			}
		});
	}
}
