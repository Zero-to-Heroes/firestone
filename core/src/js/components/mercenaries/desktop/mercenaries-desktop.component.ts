import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
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
								*ngIf="selectedCategoryId === 'mercenaries-personal-hero-stats'"
							>
							</mercenaries-personal-hero-stats>
							<mercenaries-hero-details *ngIf="selectedCategoryId === 'mercenaries-hero-details'">
							</mercenaries-hero-details>
							<mercenaries-my-teams *ngIf="selectedCategoryId === 'mercenaries-my-teams'">
							</mercenaries-my-teams>
							<mercenaries-meta-hero-stats *ngIf="selectedCategoryId === 'mercenaries-hero-stats'">
							</mercenaries-meta-hero-stats>
							<mercenaries-meta-hero-details
								*ngIf="selectedCategoryId === 'mercenaries-meta-hero-details'"
							>
							</mercenaries-meta-hero-details>
							<mercenaries-compositions-stats
								*ngIf="selectedCategoryId === 'mercenaries-compositions-stats'"
							>
							</mercenaries-compositions-stats>
							<!-- <mercenaries-composition-details
								*ngIf="selectedCategoryId === 'mercenaries-composition-details'"
							>
							</mercenaries-composition-details> -->
						</ng-container>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<ng-container *ngIf="selectedCategoryId$ | async as selectedCategoryId">
					<mercenaries-hero-search
						*ngIf="selectedCategoryId === 'mercenaries-personal-hero-stats'"
					></mercenaries-hero-search>
					<secondary-default></secondary-default>
				</ng-container>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesDesktopComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	categories$: Observable<readonly MercenariesCategoryId[]>;
	selectedCategoryId$: Observable<MercenariesCategoryId>;

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
		this.loading$ = this.store
			.listen$(([main, nav]) => main.mercenaries.loading)
			.pipe(
				map(([loading]) => loading),
				distinctUntilChanged(),
				// startWith(true),
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
		return this.i18n.translateString(`mercenaries.menu.${categoryId}`);
	}

	selectCategory(categoryId: MercenariesCategoryId) {
		this.stateUpdater.next(new MercenariesSelectCategoryEvent(categoryId));
	}
}
