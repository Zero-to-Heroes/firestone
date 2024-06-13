/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { CommunityNavigationService } from '../services/community-navigation.service';
import { PersonalCommunitiesService } from '../services/personal-communities.service';

@Component({
	selector: 'community-details',
	styleUrls: [`./community-details.component.scss`],
	template: `
		<div class="community-details">
			<div class="overview">
				<div class="community-name">{{ communityName$ | async }}</div>
				<div class="community-description">{{ communityDescription$ | async }}</div>
				<div class="total-members">
					<span class="value">{{ totalMembersStr$ | async }}</span>
					<span class="label">members</span>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityDetailsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	communityName$: Observable<string>;
	communityDescription$: Observable<string>;
	totalMembersStr$: Observable<string>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly nav: CommunityNavigationService,
		private readonly personalCommunities: PersonalCommunitiesService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.personalCommunities, this.nav);

		this.communityName$ = this.personalCommunities.selectedCommunity$$.pipe(
			this.mapData((community) => community?.name ?? ''),
		);
		this.communityDescription$ = this.personalCommunities.selectedCommunity$$.pipe(
			this.mapData((community) => `${community?.description ?? ''}`),
		);
		this.totalMembersStr$ = this.personalCommunities.selectedCommunity$$.pipe(
			this.mapData(
				(community) => `${(community?.numberOfMembers ?? 0).toLocaleString(this.i18n.formatCurrentLocale()!)}`,
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
