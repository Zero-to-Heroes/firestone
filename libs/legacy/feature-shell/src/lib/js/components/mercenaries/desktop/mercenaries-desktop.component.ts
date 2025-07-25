import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { MercenariesCategoryId } from '../../../models/mercenaries/mercenary-category-id.type';
import { AdService } from '../../../services/ad.service';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { MercenariesSelectCategoryEvent } from '../../../services/mainwindow/store/events/mercenaries/mercenaries-select-category-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	standalone: false,
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
									[ngClass]="{ selected: cat === selectedCategoryId }"
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
							<!-- <mercenaries-my-teams *ngIf="selectedCategoryId === 'mercenaries-my-teams'">
							</mercenaries-my-teams> -->
						</ng-container>
					</div>
				</with-loading>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesDesktopComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	categories$: Observable<readonly MercenariesCategoryId[]>;
	selectedCategoryId$: Observable<MercenariesCategoryId>;
	showAds$: Observable<boolean>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly ads: AdService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads);

		this.loading$ = this.store
			.listen$(([main, nav]) => main.mercenaries.loading)
			.pipe(this.mapData(([loading]) => loading));
		this.menuDisplayType$ = this.store
			.listen$(([main, nav]) => nav.navigationMercenaries.menuDisplayType)
			.pipe(this.mapData(([menuDisplayType]) => menuDisplayType));
		this.selectedCategoryId$ = this.store
			.listen$(([main, nav]) => nav.navigationMercenaries.selectedCategoryId)
			.pipe(this.mapData(([selectedCategoryId]) => selectedCategoryId));
		this.categories$ = this.store
			.listen$(([main, nav]) => main.mercenaries.categoryIds)
			.pipe(this.mapData(([categories]) => categories ?? []));
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
