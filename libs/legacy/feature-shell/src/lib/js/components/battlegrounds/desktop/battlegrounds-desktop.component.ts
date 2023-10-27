import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';
import { BattlegroundsCategory } from '../../../models/mainwindow/battlegrounds/battlegrounds-category';
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
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.categories = [
			{
				id: 'bgs-category-meta-heroes',
				name: this.i18n.translateString('app.battlegrounds.menu.heroes'),
			},
			{
				id: 'bgs-category-meta-quests',
				name: this.i18n.translateString('app.battlegrounds.menu.quests'),
			},
			{
				id: 'bgs-category-personal-rating',
				name: this.i18n.translateString('app.battlegrounds.menu.rating'),
			},
			{
				id: 'bgs-category-personal-stats',
				name: this.i18n.translateString('app.battlegrounds.menu.records'),
			},
			{
				id: 'bgs-category-perfect-games',
				name: this.i18n.translateString('app.battlegrounds.menu.perfect-games'),
			},
			{
				id: 'bgs-category-simulator',
				name: this.i18n.translateString('app.battlegrounds.menu.simulator'),
			},
		];

		this.menuDisplayType$ = this.store
			.listen$(([main, nav]) => nav.navigationBattlegrounds.menuDisplayType)
			.pipe(this.mapData(([menuDisplayType]) => menuDisplayType));
		this.categoryId$ = this.store
			.listen$(([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId)
			.pipe(
				tap((info) => console.debug('[bgs-desktop] computing category', info)),
				this.mapData(([selectedCategoryId]) => selectedCategoryId),
				tap((info) => console.debug('[bgs-desktop] computed category', info)),
				filter((category) => !!category),
				takeUntil(this.destroyed$),
			);
		this.currentView$ = this.store
			.listen$(([main, nav]) => nav.navigationBattlegrounds.currentView)
			.pipe(this.mapData(([currentView]) => currentView));
		this.showAds$ = this.store.showAds$().pipe(this.mapData((info) => info));
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectCategory(categoryId: string) {
		this.stateUpdater.next(new SelectBattlegroundsCategoryEvent(categoryId));
	}

	showSidebar(categoryId: string): boolean {
		return categoryId !== 'bgs-category-simulator';
	}
}
