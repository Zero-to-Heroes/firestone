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
import { BehaviorSubject, from, Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'tavern-brawl-desktop',
	styleUrls: [`../../../css/component/app-section.component.scss`, `./tavern-brawl-desktop.component.scss`],
	template: `
		<div class="app-section tavern-brawl" *ngIf="{ category: category$ | async } as value">
			<section class="main divider">
				<div class="content main-content" *ngIf="{ value: menuDisplayType$ | async } as menuDisplayType">
					<ul class="menu-selection">
						<li
							*ngFor="let cat of categories$ | async"
							[ngClass]="{ selected: cat === value.category }"
							(mousedown)="selectCategory(cat)"
						>
							<span>{{ getName(cat) }}</span>
						</li>
					</ul>
					<tavern-brawl-overview *ngIf="value.category === 'overview'"></tavern-brawl-overview>
					<tavern-brawl-meta-decks *ngIf="value.category === 'meta'"></tavern-brawl-meta-decks>
					<tavern-brawl-personal-decks
						*ngIf="value.category === 'personal-decks'"
					></tavern-brawl-personal-decks>
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

	private category$$ = new BehaviorSubject<TavernBrawlCategoryType>('overview');

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
		this.category$ = this.category$$.pipe(this.mapData((category) => category));
		this.categories$ = from([['overview', 'meta', 'personal-decks'] as readonly TavernBrawlCategoryType[]]);
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectCategory(categoryId: TavernBrawlCategoryType) {
		this.category$$.next(categoryId);
	}

	getName(categoryId: TavernBrawlCategoryType): string {
		return this.i18n.translateString(`app.tavern-brawl.category.${categoryId}`);
	}
}

export type TavernBrawlCategoryType = 'overview' | 'meta' | 'personal-decks';
