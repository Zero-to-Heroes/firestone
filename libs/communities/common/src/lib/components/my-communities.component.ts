/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { Community } from '../models/communities';
import { CommunityNavigationService } from '../services/community-navigation.service';
import { PersonalCommunitiesService } from '../services/personal-communities.service';

@Component({
	selector: 'my-communities',
	styleUrls: [`./my-communities.component.scss`],
	template: `
		<div class="my-communities">
			<ul class="communities-list">
				<div
					class="button community"
					(click)="goIntoCommunity(community)"
					*ngFor="let community of communities$ | async"
				>
					<div class="image"></div>
					<div class="text">{{ community.name }}</div>
				</div>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCommunitiesComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	communities$: Observable<readonly Community[]>;

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

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	goIntoCommunity(community: Community) {
		this.nav.selectedCommunity$$.next(community.id);
	}
}
