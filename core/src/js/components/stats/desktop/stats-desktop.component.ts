import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, tap } from 'rxjs/operators';
import { StatsCategory } from '../../../models/mainwindow/stats/stats-category';
import { StatsCategoryType } from '../../../models/mainwindow/stats/stats-category.type';
import { AppUiStoreService, cdLog } from '../../../services/app-ui-store.service';
import { arraysEqual } from '../../../services/utils';

@Component({
	selector: 'stats-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/stats/desktop/stats-desktop.component.scss`,
	],
	template: `
		<div class="app-section stats" *ngIf="{ value: category$ | async } as category">
			<section class="main divider">
				<with-loading [isLoading]="loading$ | async">
					<div class="content main-content" *ngIf="{ value: menuDisplayType$ | async } as menuDisplayType">
						<global-header *ngIf="menuDisplayType.value === 'breadcrumbs'"></global-header>
						<ul class="menu-selection" *ngIf="menuDisplayType.value === 'menu'">
							<li
								*ngFor="let cat of categories$ | async"
								[ngClass]="{ 'selected': cat.id === category.value?.id }"
								(mousedown)="selectCategory(cat.id)"
							>
								<span>{{ cat.name }} </span>
							</li>
						</ul>
						<stats-filters> </stats-filters>
						<stats-xp-graph *ngxCacheIf="category.value?.id === 'xp-graph'">></stats-xp-graph>
					</div>
				</with-loading>
			</section>
			<section class="secondary"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsDesktopComponent {
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	category$: Observable<StatsCategory>;
	categories$: Observable<readonly StatsCategory[]>;

	constructor(private readonly store: AppUiStoreService) {
		this.loading$ = this.store
			.listen$(([main, nav]) => main.stats.loading)
			.pipe(
				map(([loading]) => loading),
				distinctUntilChanged(),
				startWith(true),
				tap((info) => cdLog('emitting loading in ', this.constructor.name, info)),
			);
		this.menuDisplayType$ = this.store
			.listen$(([main, nav]) => nav.navigationStats.menuDisplayType)
			.pipe(
				map(([menuDisplayType]) => menuDisplayType),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting menuDisplayType in ', this.constructor.name, info)),
			);
		this.category$ = this.store
			.listen$(([main, nav]) => main.stats.findCategory(nav.navigationStats.selectedCategoryId))
			.pipe(
				filter(([category]) => !!category),
				map(([category]) => category),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting category in ', this.constructor.name, info)),
			);
		this.categories$ = this.store
			.listen$(([main, nav]) => main.stats.categories)
			.pipe(
				map(([categories]) => categories ?? []),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((info) => cdLog('emitting categories in ', this.constructor.name, info)),
			);
	}

	selectCategory(categoryId: StatsCategoryType) {
		// Only one category for now
		// this.stateUpdater.next(new StatsSelectCategoryEvent(categoryId));
	}
}
