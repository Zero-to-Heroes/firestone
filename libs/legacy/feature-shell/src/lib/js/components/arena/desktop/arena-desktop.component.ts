import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArenaCategory, ArenaCategoryType, ArenaNavigationService } from '@firestone/arena/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, tap } from 'rxjs';
import { AdService } from '../../../services/ad.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'arena-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/arena/desktop/arena-desktop.component.scss`,
	],
	template: `
		<div class="app-section arena" *ngIf="category$ | async as category">
			<section class="main divider">
				<with-loading [isLoading]="false">
					<div class="content main-content" *ngIf="{ value: menuDisplayType$ | async } as menuDisplayType">
						<global-header *ngIf="menuDisplayType.value === 'breadcrumbs'"></global-header>
						<ul class="menu-selection" *ngIf="menuDisplayType.value === 'menu'">
							<li
								*ngFor="let cat of categories; trackBy: trackByFn"
								[ngClass]="{ selected: cat.id === category }"
								(mousedown)="selectCategory(cat.id)"
							>
								<span>{{ cat.name }} </span>
							</li>
						</ul>
						<arena-filters *ngIf="category !== 'arena-deck-details'"> </arena-filters>
						<arena-runs-list *ngIf="category === 'arena-runs'"> </arena-runs-list>
						<arena-personal-stats *ngIf="category === 'arena-stats'"> </arena-personal-stats>
						<arena-class-tier-list *ngIf="category === 'class-tier-list'"> </arena-class-tier-list>
						<arena-card-stats *ngIf="category === 'card-stats'"> </arena-card-stats>
						<arena-deck-details *ngIf="category === 'arena-deck-details'"> </arena-deck-details>
						<arena-high-wins-runs *ngIf="category === 'arena-high-wins-runs'"> </arena-high-wins-runs>
					</div>
				</with-loading>
			</section>
			<section class="secondary" *ngIf="showSecondary$ | async">
				<arena-classes-recap *ngIf="category === 'arena-runs'"></arena-classes-recap>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaDesktopComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	menuDisplayType$: Observable<string>;
	category$: Observable<ArenaCategoryType>;
	showAds$: Observable<boolean>;
	showSecondary$: Observable<boolean>;

	categories: readonly ArenaCategory[];

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly nav: ArenaNavigationService,
		private readonly ads: AdService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.ads);

		this.categories = [
			{ id: 'arena-runs', name: this.i18n.translateString('app.arena.menu.my-runs') },
			{ id: 'arena-stats', name: this.i18n.translateString('app.arena.menu.my-stats') },
			{ id: 'class-tier-list', name: this.i18n.translateString('app.arena.menu.class-tier-list') },
			{ id: 'card-stats', name: this.i18n.translateString('app.arena.menu.card-stats') },
			{ id: 'arena-high-wins-runs', name: this.i18n.translateString('app.arena.menu.arena-top-runs') },
		];
		this.menuDisplayType$ = this.nav.menuDisplayType$$.pipe(this.mapData((menuDisplayType) => menuDisplayType));
		this.category$ = this.nav.selectedCategoryId$$.pipe(
			tap((selectedCategoryId) => console.debug('selectedCategoryId', selectedCategoryId)),
			this.mapData((selectedCategoryId) => selectedCategoryId),
		);
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));
		this.showSecondary$ = combineLatest([this.category$, this.showAds$]).pipe(
			this.mapData(([category, showAds]) => category === 'arena-runs' && !showAds),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectCategory(categoryId: ArenaCategoryType) {
		this.nav.selectedCategoryId$$.next(categoryId);
	}

	trackByFn(index: number, item: ArenaCategory) {
		return item.id;
	}
}
