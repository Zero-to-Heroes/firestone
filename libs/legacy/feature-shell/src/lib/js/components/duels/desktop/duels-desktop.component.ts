import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { Observable } from 'rxjs';
import { DuelsCategory } from '../../../models/mainwindow/duels/duels-category';
import { DuelsCategoryType } from '../../../models/mainwindow/duels/duels-category.type';
import { DuelsSelectCategoryEvent } from '../../../services/mainwindow/store/events/duels/duels-select-category-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'duels-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/duels/desktop/duels-desktop.component.scss`,
	],
	template: `
		<div class="app-section duels" *ngIf="{ value: category$ | async } as category">
			<section class="main divider">
				<with-loading [isLoading]="loading$ | async">
					<div class="content main-content" *ngIf="{ value: menuDisplayType$ | async } as menuDisplayType">
						<global-header *ngIf="menuDisplayType.value === 'breadcrumbs'"></global-header>
						<ul class="menu-selection" *ngIf="menuDisplayType.value === 'menu'">
							<li
								*ngFor="let cat of categories$ | async"
								[ngClass]="{ selected: cat.id === category.value?.id }"
								(mousedown)="selectCategory(cat.id)"
							>
								<span>{{ cat.name }} </span>
							</li>
						</ul>
						<duels-filters> </duels-filters>
						<duels-runs-list *ngIf="category.value?.id === 'duels-runs'"> </duels-runs-list>
						<duels-hero-stats *ngIf="category.value?.id === 'duels-stats'"></duels-hero-stats>
						<duels-treasure-stats *ngIf="category.value?.id === 'duels-treasures'"></duels-treasure-stats>
						<duels-personal-decks
							*ngIf="category.value?.id === 'duels-personal-decks'"
						></duels-personal-decks>
						<duels-personal-deck-details
							*ngIf="
								category.value?.id === 'duels-personal-deck-details' ||
								category.value?.id === 'duels-deck-details'
							"
						>
						</duels-personal-deck-details>
						<duels-top-decks *ngIf="category.value?.id === 'duels-top-decks'"> </duels-top-decks>
						<duels-leaderboard *ngIf="category.value?.id === 'duels-leaderboard'"></duels-leaderboard>
						<duels-deckbuilder *ngIf="category.value?.id === 'duels-deckbuilder'"></duels-deckbuilder>
						<duels-buckets *ngIf="category.value?.id === 'duels-buckets'"></duels-buckets>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<duels-hero-search *ngIf="category.value?.id === 'duels-stats'"></duels-hero-search>
				<duels-treasure-search *ngIf="category.value?.id === 'duels-treasures'"></duels-treasure-search>
				<duels-classes-recap *ngIf="category.value?.id === 'duels-runs'"></duels-classes-recap>
				<duels-replays-recap *ngIf="category.value?.id === 'duels-personal-decks'"></duels-replays-recap>
				<duels-treasure-tier-list *ngIf="category.value?.id === 'duels-treasures'"></duels-treasure-tier-list>
				<duels-hero-tier-list *ngIf="category.value?.id === 'duels-stats'"></duels-hero-tier-list>
				<duels-deck-stats
					*ngIf="
						category.value?.id === 'duels-personal-deck-details' ||
						category.value?.id === 'duels-deck-details'
					"
				></duels-deck-stats>
				<secondary-default
					*ngIf="category.value?.id === 'duels-top-decks' || category.value?.id === 'duels-leaderboard'"
				></secondary-default>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDesktopComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	categories$: Observable<readonly DuelsCategory[]>;
	category$: Observable<DuelsCategory>;

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
			.listen$(([main, nav]) => main.duels.loading)
			.pipe(this.mapData(([loading]) => loading));
		this.menuDisplayType$ = this.store
			.listen$(([main, nav]) => nav.navigationDuels.menuDisplayType)
			.pipe(this.mapData(([menuDisplayType]) => menuDisplayType));
		this.categories$ = this.store
			.listen$(([main, nav]) => main.duels.categories)
			.pipe(this.mapData(([categories]) => (categories ?? []).filter((cat) => !!cat.name)));
		this.category$ = this.store
			.listen$(
				([main, nav]) => main.duels,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(this.mapData(([duels, selectedCategoryId]) => duels.findCategory(selectedCategoryId)));
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectCategory(categoryId: DuelsCategoryType) {
		this.stateUpdater.next(new DuelsSelectCategoryEvent(categoryId));
	}
}
