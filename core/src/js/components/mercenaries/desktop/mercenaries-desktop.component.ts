import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, takeUntil, tap } from 'rxjs/operators';
import { MercenariesCategoryId } from '../../../models/mercenaries/mercenary-category-id.type';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { MercenariesSelectCategoryEvent } from '../../../services/mainwindow/store/events/mercenaries/mercenaries-select-category-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-desktop.component.scss`,
	],
	template: `
		<div class="app-section mercenaries">
			<section class="main divider">
				<with-loading [isLoading]="loading$ | async">
					<div class="content main-content" *ngIf="{ value: menuDisplayType$ | async } as menuDisplayType">
						<global-header *ngIf="menuDisplayType.value === 'breadcrumbs'"></global-header>
						<ng-container *ngIf="selectedCategoryId$ | async as selectedCategoryId">
							<ul class="menu-selection" *ngIf="menuDisplayType.value === 'menu'">
								<li
									*ngFor="let cat of categories$ | async"
									[ngClass]="{ 'selected': cat === selectedCategoryId }"
									(mousedown)="selectCategory(cat)"
								>
									<span>{{ getCatName(cat) }} </span>
								</li>
							</ul>
							<mercenaries-filters></mercenaries-filters>
							<mercenaries-personal-hero-stats
								*ngxCacheIf="selectedCategoryId === 'mercenaries-personal-hero-stats'"
							>
							</mercenaries-personal-hero-stats>
							<mercenaries-my-teams *ngxCacheIf="selectedCategoryId === 'mercenaries-my-teams'">
							</mercenaries-my-teams>
							<mercenaries-hero-stats *ngxCacheIf="selectedCategoryId === 'mercenaries-hero-stats'">
							</mercenaries-hero-stats>
							<mercenaries-hero-details *ngxCacheIf="selectedCategoryId === 'mercenaries-hero-details'">
							</mercenaries-hero-details>
							<mercenaries-compositions-stats
								*ngxCacheIf="selectedCategoryId === 'mercenaries-compositions-stats'"
							>
							</mercenaries-compositions-stats>
							<!-- <mercenaries-composition-details
								*ngxCacheIf="selectedCategoryId === 'mercenaries-composition-details'"
							>
							</mercenaries-composition-details> -->
						</ng-container>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<ng-container *ngIf="selectedCategoryId$ | async as selectedCategoryId">
					<mercenaries-hero-search
						*ngxCacheIf="selectedCategoryId === 'mercenaries-personal-hero-stats'"
					></mercenaries-hero-search>
					<secondary-default></secondary-default>
				</ng-container>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesDesktopComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	categories$: Observable<readonly MercenariesCategoryId[]>;
	selectedCategoryId$: Observable<MercenariesCategoryId>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.loading$ = this.store
			.listen$(([main, nav]) => main.mercenaries.loading)
			.pipe(
				map(([loading]) => loading),
				distinctUntilChanged(),
				startWith(true),
				tap((info) => cdLog('emitting loading in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.menuDisplayType$ = this.store
			.listen$(([main, nav]) => nav.navigationMercenaries.menuDisplayType)
			.pipe(
				map(([menuDisplayType]) => menuDisplayType),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting menuDisplayType in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.selectedCategoryId$ = this.store
			.listen$(([main, nav]) => nav.navigationMercenaries.selectedCategoryId)
			.pipe(
				map(([selectedCategoryId]) => selectedCategoryId),
				filter((selectedCategoryId) => !!selectedCategoryId),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting selectedCategoryId in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.categories$ = this.store
			.listen$(([main, nav]) => main.mercenaries.categoryIds)
			.pipe(
				map(([categories]) => categories ?? []),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting categories in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	getCatName(categoryId: MercenariesCategoryId) {
		switch (categoryId) {
			case 'mercenaries-personal-hero-stats':
				return 'Progression';
			case 'mercenaries-my-teams':
				return 'My PvP Teams';
			case 'mercenaries-hero-stats':
				return 'PvP Heroes';
			case 'mercenaries-compositions-stats':
				return 'PvP Teams';
			default:
				console.error('Missing category id <-> name mapping', categoryId);
				return null;
		}
	}

	selectCategory(categoryId: MercenariesCategoryId) {
		this.stateUpdater.next(new MercenariesSelectCategoryEvent(categoryId));
	}
}
