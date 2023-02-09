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
		<div class="app-section battlegrounds" *ngIf="{ value: category$ | async } as category">
			<section class="main divider">
				<with-loading [isLoading]="loading$ | async">
					<div class="content main-content" *ngIf="{ value: menuDisplayType$ | async } as menuDisplayType">
						<global-header *ngIf="menuDisplayType.value === 'breadcrumbs'"></global-header>
						<nav class="menu-selection" *ngIf="menuDisplayType.value === 'menu'">
							<button
								class="menu-item"
								tabindex="0"
								*ngFor="let cat of categories$ | async"
								[ngClass]="{ selected: cat.id === category.value?.id }"
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
									category.value?.id !== 'bgs-category-personal-heroes' &&
									category.value?.id !== 'bgs-category-meta-heroes' &&
									category.value?.id !== 'bgs-category-personal-quests' &&
									category.value?.id !== 'bgs-category-simulator'
							}"
						>
						</battlegrounds-category-details>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<battlegrounds-tier-list
					*ngIf="
						category.value?.id === 'bgs-category-personal-heroes' ||
						category.value?.id === 'bgs-category-meta-heroes'
					"
				></battlegrounds-tier-list>
				<battlegrounds-quests-tier-list
					*ngIf="category.value?.id === 'bgs-category-personal-quests'"
				></battlegrounds-quests-tier-list>
				<battlegrounds-heroes-records-broken
					*ngIf="category.value?.id === 'bgs-category-personal-stats'"
				></battlegrounds-heroes-records-broken>
				<battlegrounds-replays-recap
					*ngIf="
						category.value?.id === 'bgs-category-personal-rating' ||
						category.value?.id?.includes('bgs-category-personal-hero-details-')
					"
				></battlegrounds-replays-recap>
				<secondary-default *ngIf="category.value?.id === 'bgs-category-simulator'"></secondary-default>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsDesktopComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	currentView$: Observable<string>;
	categories$: Observable<readonly BattlegroundsCategory[]>;
	category$: Observable<BattlegroundsCategory>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.loading$ = this.store
			.listen$(([main, nav]) => main.battlegrounds.loading)
			.pipe(this.mapData(([loading]) => loading));
		this.menuDisplayType$ = this.store
			.listen$(([main, nav]) => nav.navigationBattlegrounds.menuDisplayType)
			.pipe(this.mapData(([menuDisplayType]) => menuDisplayType));
		this.category$ = this.store
			.listen$(
				([main, nav]) => main.battlegrounds,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
			)
			.pipe(
				this.mapData(([battlegrounds, selectedCategoryId]) => battlegrounds.findCategory(selectedCategoryId)),
				filter((category) => !!category),
				takeUntil(this.destroyed$),
			);
		this.currentView$ = this.store
			.listen$(([main, nav]) => nav.navigationBattlegrounds.currentView)
			.pipe(this.mapData(([currentView]) => currentView));
		this.categories$ = this.store
			.listen$(([main, nav]) => main.battlegrounds.categories)
			.pipe(
				tap((info) => console.debug('categories', info)),
				this.mapData(([categories]) => categories ?? []),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectCategory(categoryId: string) {
		this.stateUpdater.next(new SelectBattlegroundsCategoryEvent(categoryId));
	}
}
