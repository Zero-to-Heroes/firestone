import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { MainWindowNavigationService, MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { MercenariesCategoryId } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { MercenariesSelectCategoryEvent } from '../../../services/mainwindow/store/events/mercenaries/mercenaries-select-category-event';

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
export class MercenariesDesktopComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	categories$: Observable<readonly MercenariesCategoryId[]>;
	selectedCategoryId$: Observable<MercenariesCategoryId>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
		private readonly navigationService: MainWindowNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads, this.navigationService, this.mainWindowStateFacade);

		this.loading$ = this.mainWindowStateFacade.mainWindowState$$.pipe(
			this.mapData((state) => state.mercenaries.loading),
		);
		this.menuDisplayType$ = this.navigationService.navigationState$$.pipe(
			this.mapData((state) => state.navigationMercenaries.menuDisplayType),
		);
		this.selectedCategoryId$ = this.navigationService.navigationState$$.pipe(
			this.mapData((state) => state.navigationMercenaries.selectedCategoryId),
		);
		this.categories$ = this.mainWindowStateFacade.mainWindowState$$.pipe(
			this.mapData((state) => state.mercenaries.categoryIds),
		);
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	getCatName(categoryId: MercenariesCategoryId) {
		return this.i18n.translateString(`mercenaries.menu.${categoryId}`);
	}

	selectCategory(categoryId: MercenariesCategoryId) {
		this.mainWindowStateFacade.send(new MercenariesSelectCategoryEvent(categoryId));
	}
}
