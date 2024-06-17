/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CommunityInfo } from '@firestone-hs/communities';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { CommunityNavigationService } from '../services/community-navigation.service';
import { PersonalCommunitiesService } from '../services/personal-communities.service';

@Component({
	selector: 'my-communities',
	styleUrls: [`./my-communities.component.scss`],
	template: `
		<div class="my-communities" *ngIf="{ hasCommunities: hasCommunities$ | async } as value">
			<ul class="communities-list" *ngIf="value.hasCommunities">
				<div
					class="button community"
					(click)="goIntoCommunity(community)"
					*ngFor="let community of communities$ | async"
				>
					<div class="image"></div>
					<div class="text">{{ community.name }}</div>
				</div>
			</ul>
			<div *ngIf="!value.hasCommunities" class="no-communities">You are not part of any guild yet</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCommunitiesComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	hasCommunities$: Observable<boolean>;
	communities$: Observable<readonly CommunityInfo[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly nav: CommunityNavigationService,
		private readonly personalCommunities: PersonalCommunitiesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.personalCommunities);

		this.communities$ = this.personalCommunities.communities$$.pipe(
			this.mapData((communities) => communities ?? []),
		);
		this.hasCommunities$ = this.communities$.pipe(this.mapData((communities) => !!communities?.length));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	goIntoCommunity(community: CommunityInfo) {
		this.nav.selectedCommunity$$.next(community.id);
		this.nav.category$$.next('community-details');
	}
}
