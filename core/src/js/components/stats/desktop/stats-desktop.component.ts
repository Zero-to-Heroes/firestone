import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { StatsCategory } from '../../../models/mainwindow/stats/stats-category';
import { StatsCategoryType } from '../../../models/mainwindow/stats/stats-category.type';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

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
						<stats-xp-graph *ngIf="category.value?.id === 'xp-graph'">></stats-xp-graph>
					</div>
				</with-loading>
			</section>
			<section class="secondary"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsDesktopComponent extends AbstractSubscriptionComponent {
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	category$: Observable<StatsCategory>;
	categories$: Observable<readonly StatsCategory[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
		this.loading$ = this.store
			.listen$(([main, nav]) => main.stats.loading)
			.pipe(
				map(([loading]) => loading),
				distinctUntilChanged(),
				// startWith(true),
				tap((info) => cdLog('emitting loading in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.menuDisplayType$ = this.store
			.listen$(([main, nav]) => nav.navigationStats.menuDisplayType)
			.pipe(
				map(([menuDisplayType]) => menuDisplayType),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting menuDisplayType in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.category$ = this.store
			.listen$(
				([main, nav]) => main.stats,
				([main, nav]) => nav.navigationStats.selectedCategoryId,
			)
			.pipe(
				map(([stats, selectedCategoryId]) => stats.findCategory(selectedCategoryId)),
				filter((category) => !!category),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting category in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.categories$ = this.store
			.listen$(([main, nav]) => main.stats.categories)
			.pipe(
				map(([categories]) => categories ?? []),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((info) => cdLog('emitting categories in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
	}

	selectCategory(categoryId: StatsCategoryType) {
		// Only one category for now
		// this.stateUpdater.next(new StatsSelectCategoryEvent(categoryId));
	}
}
