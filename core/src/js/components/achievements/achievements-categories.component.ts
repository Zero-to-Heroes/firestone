import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import { SelectAchievementCategoryEvent } from '../../services/mainwindow/store/events/achievements/select-achievement-category-event';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'achievements-categories',
	styleUrls: [
		`../../../css/component/achievements/achievements-categories.component.scss`,
		`../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="achievements-categories" scrollable>
			<ul class="categories">
				<achievement-category
					*ngFor="let category of categories$ | async; trackBy: trackByFn"
					class="item"
					[category]="category"
					(mousedown)="selectCategory(category)"
				></achievement-category>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsCategoriesComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	categories$: Observable<readonly VisualAchievementCategory[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.categories$ = this.store
			.listen$(
				([main, nav, prefs]) => main.achievements.categories,
				([main, nav, prefs]) => nav.navigationAchievements.selectedCategoryId,
			)
			.pipe(
				this.mapData(
					([categories, selectedCategoryId]) =>
						categories.map((cat) => cat.findCategory(selectedCategoryId)).filter((cat) => cat)[0]
							?.categories ?? categories,
				),
			);
	}

	selectCategory(category: VisualAchievementCategory) {
		this.store.send(new SelectAchievementCategoryEvent(category.id));
	}

	trackByFn(index: number, value: VisualAchievementCategory) {
		return value.id;
	}
}
