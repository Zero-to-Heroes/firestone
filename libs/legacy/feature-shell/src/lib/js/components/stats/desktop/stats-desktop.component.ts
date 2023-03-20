import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { StatsCategory } from '../../../models/mainwindow/stats/stats-category';
import { StatsCategoryType } from '../../../models/mainwindow/stats/stats-category.type';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

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
								[ngClass]="{ selected: cat.id === category.value?.id }"
								(mousedown)="selectCategory(cat.id)"
							>
								<span>{{ cat.name }} </span>
							</li>
						</ul>
						<stats-filters> </stats-filters>
						<stats-xp-graph *ngIf="category.value?.id === 'xp-graph'"></stats-xp-graph>
					</div>
				</with-loading>
			</section>
			<section class="secondary" *ngIf="!(showAds$ | async)"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsDesktopComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	category$: Observable<StatsCategory>;
	categories$: Observable<readonly StatsCategory[]>;
	showAds$: Observable<boolean>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.loading$ = this.store
			.listen$(([main, nav]) => main.stats.loading)
			.pipe(this.mapData(([loading]) => loading));
		this.menuDisplayType$ = this.store
			.listen$(([main, nav]) => nav.navigationStats.menuDisplayType)
			.pipe(this.mapData(([menuDisplayType]) => menuDisplayType));
		this.category$ = this.store
			.listen$(
				([main, nav]) => main.stats,
				([main, nav]) => nav.navigationStats.selectedCategoryId,
			)
			.pipe(this.mapData(([stats, selectedCategoryId]) => stats.findCategory(selectedCategoryId)));
		this.categories$ = this.store
			.listen$(([main, nav]) => main.stats.categories)
			.pipe(this.mapData(([categories]) => categories ?? []));
		this.showAds$ = this.store.showAds$().pipe(this.mapData((info) => info));
	}

	selectCategory(categoryId: StatsCategoryType) {
		// Only one category for now
		// this.stateUpdater.next(new StatsSelectCategoryEvent(categoryId));
	}
}
