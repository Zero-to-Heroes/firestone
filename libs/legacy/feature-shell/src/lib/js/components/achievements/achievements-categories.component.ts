import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { AchievementsNavigationService } from '@firestone/achievements/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import { AchievementsStateManagerService } from '../../services/achievement/achievements-state-manager.service';
import { SelectAchievementCategoryEvent } from '../../services/mainwindow/store/events/achievements/select-achievement-category-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';

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

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly achievements: AchievementsStateManagerService,
		private readonly nav: AchievementsNavigationService,
		private readonly ow: OverwolfService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.achievements, this.nav);

		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;

		this.categories$ = combineLatest([this.achievements.groupedAchievements$$, this.nav.selectedCategoryId$$]).pipe(
			this.mapData(
				([categories, selectedCategoryId]) =>
					categories?.map((cat) => cat.findCategory(selectedCategoryId)).filter((cat) => cat)[0]
						?.categories ??
					categories ??
					[],
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectCategory(category: VisualAchievementCategory) {
		this.stateUpdater.next(new SelectAchievementCategoryEvent(category.id));
	}

	trackByFn(index: number, value: VisualAchievementCategory) {
		return value.id;
	}
}
