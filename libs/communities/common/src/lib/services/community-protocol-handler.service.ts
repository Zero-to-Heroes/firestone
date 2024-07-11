import { Injectable } from '@angular/core';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
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
		const href = decodeURIComponent(window.location.href);
		console.debug('[communities] init protocol handler', href);
		if (href.includes('firestoneapp://guilds/join/')) {
			const communityAndJoinCode = href.split('firestoneapp://guilds/join/')[1];
			console.debug('[communities] joining community?', communityAndJoinCode);
			if (!communityAndJoinCode?.includes('?')) {
				return;
			}
			const [communityId, joinCode] = communityAndJoinCode.split('?');
			this.startJoinCommunity(communityId, joinCode);
		}

		this.ow.addAppLaunchTriggeredListener(async (info) => {
			console.debug('[communities] app launch triggered', info);
			if (
				info?.origin === 'urlscheme' &&
				decodeURIComponent(info.parameter).startsWith('firestoneapp://guilds/join/')
			) {
				const communityAndJoinCode = decodeURIComponent(info.parameter).split('firestoneapp://guilds/join/')[1];
				console.debug('[communities] joining community', communityAndJoinCode);
				if (!communityAndJoinCode?.includes('?')) {
					return;
				}
				const [communityId, joinCode] = communityAndJoinCode.split('?');
				await this.startJoinCommunity(communityId, joinCode);
			}
		});
	}

	private async startJoinCommunity(communityId: string, joinCode: string) {
		console.debug('[communities] starting join community', communityId, joinCode);
		await waitForReady(this.mainNav, this.nav, this.communityJoinService);

		this.mainNav.currentApp$$.next('communities');
		this.nav.changeCategory('my-communities');
		console.debug('[communities] changed navigation');
		console.debug('[communities] communityId', communityId, 'joinCode', joinCode);
		// TODO: make sure that multiple communities can use the same join code
		const joinedComunity = await this.communityJoinService.joinCommunity(joinCode);
		console.debug('[communities] joinedComunity', joinedComunity);
		if (!!joinedComunity && joinedComunity.id === communityId) {
			this.nav.selectedCommunity$$.next(joinedComunity.id);
			this.nav.category$$.next('community-details');
			console.debug('[communities] changed selected community');
		}
	}
}
