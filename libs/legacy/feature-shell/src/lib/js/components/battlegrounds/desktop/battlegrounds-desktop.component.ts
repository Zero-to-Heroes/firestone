import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import {
	BG_USE_QUESTS,
	BG_USE_QUESTS_IN_DESKTOP,
	BG_USE_TRINKETS,
	BattlegroundsNavigationService,
	CategoryId,
} from '@firestone/battlegrounds/common';
import { ENABLE_BGS_COMP_STATS } from '@firestone/shared/common/service';
import { AnalyticsService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { BattlegroundsCategory } from '../../../models/mainwindow/battlegrounds/battlegrounds-category';
import { AdService } from '../../../services/ad.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { SelectBattlegroundsCategoryEvent } from '../../../services/mainwindow/store/events/battlegrounds/select-battlegrounds-category-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/battlegrounds/desktop/battlegrounds-desktop.component.scss`,
	],
	template: `
		<div class="app-section battlegrounds" *ngIf="{ categoryId: categoryId$ | async } as valueRoot">
			<section class="main divider">
				<with-loading>
					<div class="content main-content" *ngIf="{ value: menuDisplayType$ | async } as menuDisplayType">
						<global-header *ngIf="menuDisplayType.value === 'breadcrumbs'"></global-header>
						<nav class="menu-selection" *ngIf="menuDisplayType.value === 'menu'">
							<button
								class="menu-item"
								tabindex="0"
								*ngFor="let cat of categories"
								[ngClass]="{ selected: cat.id === valueRoot.categoryId }"
								(mousedown)="selectCategory(cat.id)"
							>
								<span>{{ cat.name }} </span>
							</button>
						</nav>
						<!-- hidden until proper support for dropdown is added -->
						<battlegrounds-filters aria-hidden="true"> </battlegrounds-filters>
						<battlegrounds-category-details
							*ngIf="(currentView$ | async) === 'list'"
							[ngClass]="{
								top:
									valueRoot.categoryId !== 'bgs-category-personal-heroes' &&
									valueRoot.categoryId !== 'bgs-category-meta-heroes' &&
									valueRoot.categoryId !== 'bgs-category-simulator'
							}"
						>
						</battlegrounds-category-details>
					</div>
				</with-loading>
			</section>
			<section class="secondary" *ngIf="!(showAds$ | async) && showSidebar(valueRoot.categoryId)">
				<battlegrounds-tier-list
					*ngIf="
						valueRoot.categoryId === 'bgs-category-personal-heroes' ||
						valueRoot.categoryId === 'bgs-category-meta-heroes'
					"
				></battlegrounds-tier-list>
				<!-- <battlegrounds-quests-tier-list
					*ngIf="valueRoot.categoryId === 'bgs-category-personal-quests'"
				></battlegrounds-quests-tier-list> -->
				<battlegrounds-heroes-records-broken
					*ngIf="valueRoot.categoryId === 'bgs-category-personal-stats'"
				></battlegrounds-heroes-records-broken>
				<battlegrounds-replays-recap
					*ngIf="
						valueRoot.categoryId === 'bgs-category-personal-rating' ||
						valueRoot.categoryId?.includes('bgs-category-personal-hero-details-')
					"
				></battlegrounds-replays-recap>
				<secondary-default></secondary-default>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsDesktopComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	categories: readonly BattlegroundsCategory[];

	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	currentView$: Observable<string>;
	categoryId$: Observable<string>;
	showAds$: Observable<boolean>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly analytics: AnalyticsService,
		private readonly nav: BattlegroundsNavigationService,
		private readonly ads: AdService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.ads);

		this.categories = [
			{
				id: 'bgs-category-your-stats',
				name: this.i18n.translateString('app.battlegrounds.menu.your-stats'),
			},
			{
				id: 'bgs-category-meta-heroes',
				name: this.i18n.translateString('app.battlegrounds.menu.heroes'),
			},
			ENABLE_BGS_COMP_STATS
				? {
						id: 'bgs-category-meta-comps',
						name: this.i18n.translateString('app.battlegrounds.menu.comps'),
				  }
				: null,
			{
				id: 'bgs-category-meta-cards',
				name: this.i18n.translateString('app.battlegrounds.menu.cards'),
			},
			BG_USE_QUESTS || BG_USE_QUESTS_IN_DESKTOP
				? {
						id: 'bgs-category-meta-quests',
						name: this.i18n.translateString('app.battlegrounds.menu.quests'),
				  }
				: null,
			BG_USE_TRINKETS
				? {
						id: 'bgs-category-meta-trinkets',
						name: this.i18n.translateString('app.battlegrounds.menu.trinkets'),
				  }
				: null,
			{
				id: 'bgs-category-personal-rating',
				name: this.i18n.translateString('app.battlegrounds.menu.rating'),
			},
			{
				id: 'bgs-category-perfect-games',
				name: this.i18n.translateString('app.battlegrounds.menu.perfect-games'),
			},
			{
				id: 'bgs-category-leaderboard',
				name: this.i18n.translateString('app.battlegrounds.menu.leaderboard'),
			},
			{
				id: 'bgs-category-simulator',
				name: this.i18n.translateString('app.battlegrounds.menu.simulator'),
			},
		].filter((c) => !!c) as readonly BattlegroundsCategory[];

		this.menuDisplayType$ = this.store
			.listen$(([main, nav]) => nav.navigationBattlegrounds.menuDisplayType)
			.pipe(this.mapData(([menuDisplayType]) => menuDisplayType));
		this.categoryId$ = this.nav.selectedCategoryId$$.pipe(this.mapData((selectedCategoryId) => selectedCategoryId));
		this.currentView$ = this.store
			.listen$(([main, nav]) => nav.navigationBattlegrounds.currentView)
			.pipe(this.mapData(([currentView]) => currentView));
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectCategory(categoryId: string) {
		this.analytics.trackEvent('bgs-navigation', { section: categoryId });
		this.stateUpdater.next(new SelectBattlegroundsCategoryEvent(categoryId));
	}

	showSidebar(categoryId: string): boolean {
		const sidebar: CategoryId[] = ['bgs-category-personal-rating'];
		return (
			sidebar.includes(categoryId as CategoryId) ||
			categoryId?.indexOf('bgs-category-personal-hero-details') !== -1
		);
	}
}
