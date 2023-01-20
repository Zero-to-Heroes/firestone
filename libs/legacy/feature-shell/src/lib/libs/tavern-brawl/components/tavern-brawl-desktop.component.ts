import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { Observable } from 'rxjs';
import { TavernBrawlCategoryType } from '../tavern-brawl-state';

@Component({
	selector: 'tavern-brawl-desktop',
	styleUrls: [`../../../css/component/app-section.component.scss`, `./tavern-brawl-desktop.component.scss`],
	template: `
		<div class="app-section tavern-brawl" *ngIf="{ category: category$ | async } as value">
			<section class="main divider">
				<div class="content main-content" *ngIf="{ value: menuDisplayType$ | async } as menuDisplayType">
					<global-header *ngIf="menuDisplayType.value === 'breadcrumbs'"></global-header>
					<ul class="menu-selection" *ngIf="menuDisplayType.value === 'menu'">
						<li
							*ngFor="let cat of categories$ | async"
							[ngClass]="{ selected: cat === value.category }"
							(mousedown)="selectCategory(cat)"
						>
							<span>{{ getName(cat) }}</span>
						</li>
					</ul>
					<tavern-brawl-meta *ngIf="value.category === 'meta'"></tavern-brawl-meta>
				</div>
			</section>
			<section class="secondary"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TavernBrawlDesktopComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, OnDestroy
{
	menuDisplayType$: Observable<string>;
	category$: Observable<TavernBrawlCategoryType>;
	categories$: Observable<readonly TavernBrawlCategoryType[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.menuDisplayType$ = this.store.tavernBrawl$().pipe(this.mapData((state) => state.menuDisplayType));
		this.category$ = this.store.tavernBrawl$().pipe(this.mapData((state) => state.selectedCategoryId));
		this.categories$ = this.store.tavernBrawl$().pipe(this.mapData((state) => state.categories));
	}

	selectCategory(categoryId: TavernBrawlCategoryType) {
		// Do nothing, only one category
	}

	getName(categoryId: TavernBrawlCategoryType): string {
		return this.i18n.translateString(`app.tavern-brawl.category.${categoryId}`);
	}
}
