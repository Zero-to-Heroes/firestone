import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { StatsCategory, StatsCategoryType } from '../../../models/mainwindow/stats/stats-category';
import { AdService } from '../../../services/ad.service';
import { ProfileSelectCategoryEvent } from '../../../services/mainwindow/store/processors/stats/profile-select-category';
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
						<stats-filters *ngIf="showFilters$ | async"> </stats-filters>
						<stats-xp-graph *ngIf="category.value?.id === 'xp-graph'"></stats-xp-graph>
						<profile-match-stats *ngIf="category.value?.id === 'match-stats'"></profile-match-stats>
					</div>
				</with-loading>
			</section>
			<section class="secondary" *ngIf="!(showAds$ | async) && false"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsDesktopComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	category$: Observable<StatsCategory>;
	categories$: Observable<readonly StatsCategory[]>;
	showFilters$: Observable<boolean>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ads: AdService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads);

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
		this.showFilters$ = this.store
			.listen$(([main, nav]) => nav.navigationStats.selectedCategoryId)
			.pipe(this.mapData(([selectedCategoryId]) => selectedCategoryId !== 'match-stats'));
		this.categories$ = this.store
			.listen$(([main, nav]) => main.stats.categories)
			.pipe(this.mapData(([categories]) => categories ?? []));
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectCategory(categoryId: StatsCategoryType) {
		this.store.send(new ProfileSelectCategoryEvent(categoryId));
	}
}
