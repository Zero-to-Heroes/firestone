import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { AdService } from '@legacy-import/src/lib/js/services/ad.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { from, Observable } from 'rxjs';

@Component({
	standalone: false,
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
			<section class="secondary" *ngIf="!(showAds$ | async) && false"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TavernBrawlDesktopComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	menuDisplayType$: Observable<string>;
	category$: Observable<TavernBrawlCategoryType>;
	categories$: Observable<readonly TavernBrawlCategoryType[]>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly ads: AdService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads);

		this.menuDisplayType$ = from(['menu']);
		this.category$ = from(['meta' as TavernBrawlCategoryType]);
		this.categories$ = from([['meta' as TavernBrawlCategoryType]]);
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectCategory(categoryId: TavernBrawlCategoryType) {
		// Do nothing, only one category
	}

	getName(categoryId: TavernBrawlCategoryType): string {
		return this.i18n.translateString(`app.tavern-brawl.category.${categoryId}`);
	}
}

export type TavernBrawlCategoryType = 'meta';
