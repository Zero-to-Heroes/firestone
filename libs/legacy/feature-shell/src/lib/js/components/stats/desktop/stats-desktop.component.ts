import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import {
	MainWindowNavigationService,
	MainWindowStateFacadeService,
	StatsCategory,
	StatsCategoryType,
} from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { ProfileSelectCategoryEvent } from '../../../services/mainwindow/store/processors/stats/profile-select-category';

@Component({
	standalone: false,
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
export class StatsDesktopComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	category$: Observable<StatsCategory>;
	categories$: Observable<readonly StatsCategory[]>;
	showFilters$: Observable<boolean>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly nav: MainWindowNavigationService,
		private readonly mainWindowState: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads, this.nav, this.mainWindowState);

		this.loading$ = this.mainWindowState.mainWindowState$$.pipe(this.mapData((state) => state.stats.loading));
		this.menuDisplayType$ = this.nav.navigationState$$.pipe(
			this.mapData((state) => state.navigationStats.menuDisplayType),
		);
		this.category$ = combineLatest([
			this.mainWindowState.mainWindowState$$.pipe(this.mapData((state) => state.stats)),
			this.nav.navigationState$$.pipe(this.mapData((state) => state.navigationStats.selectedCategoryId)),
		]).pipe(this.mapData(([stats, selectedCategoryId]) => stats.findCategory(selectedCategoryId)));
		this.showFilters$ = this.nav.navigationState$$.pipe(
			this.mapData((state) => state.navigationStats.selectedCategoryId !== 'match-stats'),
		);
		this.categories$ = this.mainWindowState.mainWindowState$$.pipe(this.mapData((state) => state.stats.categories));
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	selectCategory(categoryId: StatsCategoryType) {
		this.mainWindowState.send(new ProfileSelectCategoryEvent(categoryId));
	}
}
