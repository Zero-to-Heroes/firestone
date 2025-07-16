import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
	selector: 'battlegrounds-category-details',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/battlegrounds/desktop/battlegrounds-category-details.component.scss`,
	],
	template: `
		<div
			class="battlegrounds-category-details"
			scrollable
			*ngIf="selectedCategoryId$ | async as selectedCategoryId"
		>
			<battlegrounds-desktop-your-stats *ngIf="selectedCategoryId === 'bgs-category-your-stats'" role="region">
			</battlegrounds-desktop-your-stats>
			<battlegrounds-meta-stats-heroes *ngIf="selectedCategoryId === 'bgs-category-meta-heroes'" role="region">
			</battlegrounds-meta-stats-heroes>
			<battlegrounds-meta-stats-quests *ngIf="selectedCategoryId === 'bgs-category-meta-quests'" role="region">
			</battlegrounds-meta-stats-quests>
			<battlegrounds-meta-stats-trinkets
				*ngIf="selectedCategoryId === 'bgs-category-meta-trinkets'"
				role="region"
			>
			</battlegrounds-meta-stats-trinkets>
			<battlegrounds-meta-stats-comps *ngIf="selectedCategoryId === 'bgs-category-meta-comps'" role="region">
			</battlegrounds-meta-stats-comps>
			<battlegrounds-meta-stats-cards *ngIf="selectedCategoryId === 'bgs-category-meta-cards'" role="region">
			</battlegrounds-meta-stats-cards>
			<battlegrounds-personal-stats-rating *ngIf="selectedCategoryId === 'bgs-category-personal-rating'">
			</battlegrounds-personal-stats-rating>
			<battlegrounds-personal-stats-stats *ngIf="selectedCategoryId === 'bgs-category-personal-stats'">
			</battlegrounds-personal-stats-stats>
			<battlegrounds-perfect-games *ngIf="selectedCategoryId === 'bgs-category-perfect-games'">
			</battlegrounds-perfect-games>
			<battlegrounds-leaderboards *ngIf="selectedCategoryId === 'bgs-category-leaderboard'">
			</battlegrounds-leaderboards>
			<battlegrounds-personal-stats-hero-details
				*ngIf="selectedCategoryId && selectedCategoryId.indexOf('bgs-category-personal-hero-details') !== -1"
			>
			</battlegrounds-personal-stats-hero-details>
			<battlegrounds-simulator *ngIf="selectedCategoryId === 'bgs-category-simulator'"> </battlegrounds-simulator>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCategoryDetailsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	selectedCategoryId$: Observable<string>;

	constructor(protected readonly cdr: ChangeDetectorRef, private readonly nav: BattlegroundsNavigationService) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.selectedCategoryId$ = this.nav.selectedCategoryId$$.pipe(
			filter((selectedCategoryId) => !!selectedCategoryId),
			this.mapData((selectedCategoryId) => selectedCategoryId),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
