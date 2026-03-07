import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import {
	AchievementsNavigationService,
	AchievementsStateManagerService,
	findCategory,
	VisualAchievementCategory,
} from '@firestone/achievements/common';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { SelectAchievementCategoryEvent } from '@firestone/mainwindow/common';

@Component({
	standalone: false,
	selector: 'achievements-categories',
	styleUrls: [`../../../css/component/achievements/achievements-categories.component.scss`],
	template: `
		<ng-container *ngIf="{ categories: categories$ | async } as value">
			<with-loading [isLoading]="!value.categories?.length">
				<div class="achievements-categories" scrollable>
					<ul class="categories">
						<achievement-category
							*ngFor="let category of value.categories; trackBy: trackByFn"
							class="item"
							[category]="category"
							(mousedown)="selectCategory(category)"
						></achievement-category>
					</ul>
				</div>
			</with-loading>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsCategoriesComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	categories$: Observable<readonly VisualAchievementCategory[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly achievements: AchievementsStateManagerService,
		private readonly nav: AchievementsNavigationService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.achievements, this.nav, this.mainWindowStateFacade);

		this.categories$ = combineLatest([this.achievements.groupedAchievements$$, this.nav.selectedCategoryId$$]).pipe(
			this.mapData(
				([categories, selectedCategoryId]) =>
					findCategory(selectedCategoryId, categories ?? [])?.categories ?? categories ?? [],
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	selectCategory(category: VisualAchievementCategory) {
		this.mainWindowStateFacade.send(new SelectAchievementCategoryEvent(category.id));
	}

	trackByFn(index: number, value: VisualAchievementCategory) {
		return value.id;
	}
}
