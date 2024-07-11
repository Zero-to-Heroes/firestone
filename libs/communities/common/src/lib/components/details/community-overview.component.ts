/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { CommunityNavigationService } from '../../services/community-navigation.service';
import { PersonalCommunitiesService } from '../../services/personal-communities.service';

@Component({
	selector: 'community-overview',
	styleUrls: [`./community-overview.component.scss`],
	template: `
		<div class="overview">
			<div class="overview-cartouche">
				<div class="community-name">{{ communityName$ | async }}</div>
				<div class="community-description">{{ communityDescription$ | async }}</div>
				<div class="total-members">
					<span class="value">{{ totalMembersStr$ | async }}</span>
					<span class="label" [fsTranslate]="'app.communities.details.total-members'"></span>
				</div>
				<div class="recent-games">
					<span class="value">{{ totalGamesLastWeekStr$ | async }}</span>
					<span class="label">{{ gamesPlayedLabel }}</span>
				</div>
			</div>
			<div
				class="leave-community-button"
				[fsTranslate]="'app.communities.leave-community-button'"
				(click)="leaveCommunity()"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityOverviewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	communityName$: Observable<string>;
	communityDescription$: Observable<string>;
	totalMembersStr$: Observable<string>;
	totalGamesLastWeekStr$: Observable<string>;

	gamesPlayedLabel = this.i18n.translateString('app.communities.details.games-played', { value: 7 })!;

	private communityId: string | undefined;

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
		this.totalGamesLastWeekStr$ = this.personalCommunities.selectedCommunity$$.pipe(
			this.mapData(
				(community) =>
					`${(community?.gamesInLastSevenDays ?? 0).toLocaleString(this.i18n.formatCurrentLocale()!)}`,
			),
		);
		this.personalCommunities.selectedCommunity$$
			.pipe(this.mapData((c) => c?.id))
			.subscribe((id) => (this.communityId = id));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	leaveCommunity() {
		this.personalCommunities.leaveCommunity(this.communityId!);
	}
}
