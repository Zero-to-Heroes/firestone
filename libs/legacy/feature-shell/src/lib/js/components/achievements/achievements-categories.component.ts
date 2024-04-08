import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import { AchievementsStateManagerService } from '../../services/achievement/achievements-state-manager.service';
import { SelectAchievementCategoryEvent } from '../../services/mainwindow/store/events/achievements/select-achievement-category-event';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
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
export class AchievementsCategoriesComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	categories$: Observable<readonly VisualAchievementCategory[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly achievements: AchievementsStateManagerService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.achievements);

		this.categories$ = combineLatest([
			this.achievements.groupedAchievements$$,
			this.store.listen$(([main, nav, prefs]) => nav.navigationAchievements.selectedCategoryId),
		]).pipe(
			this.mapData(
				([categories, [selectedCategoryId]]) =>
					categories.map((cat) => cat.findCategory(selectedCategoryId)).filter((cat) => cat)[0]?.categories ??
					categories,
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectCategory(category: VisualAchievementCategory) {
		this.store.send(new SelectAchievementCategoryEvent(category.id));
	}

	trackByFn(index: number, value: VisualAchievementCategory) {
		return value.id;
	}
}
