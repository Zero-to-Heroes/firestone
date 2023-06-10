import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ExtendedProfileAchievementCategory, WebsiteProfileState } from '../+state/website/profile.models';
import { getAchievementCategories } from '../+state/website/profile.selectors';

@Component({
	selector: 'website-profile-achievements-overview',
	styleUrls: [`./website-profile-achievements-overview.component.scss`],
	template: `
		<div class="card achievement" *ngFor="let category of categories$ | async">
			<achievement-category-view
				[empty]="category.empty"
				[complete]="category.complete"
				[displayName]="category.displayName"
				[categoryImage]="category.categoryImage"
				[achieved]="category.completedAchievements"
				[totalAchievements]="category.totalAchievements"
			>
			</achievement-category-view>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileAchievementsOverviewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	categories$: Observable<readonly ExtendedProfileAchievementCategory[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteProfileState>,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.categories$ = this.store.select(getAchievementCategories);
	}
}
