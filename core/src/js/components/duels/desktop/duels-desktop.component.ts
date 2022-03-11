import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { DuelsCategory } from '../../../models/mainwindow/duels/duels-category';
import { DuelsCategoryType } from '../../../models/mainwindow/duels/duels-category.type';
import { DuelsSelectCategoryEvent } from '../../../services/mainwindow/store/events/duels/duels-select-category-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

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
						{{ value }}
						<global-header *ngIf="menuDisplayType.value === 'breadcrumbs'"></global-header>
						<ul class="menu-selection" *ngIf="menuDisplayType.value === 'menu'">
							<li
								*ngFor="let cat of categories$ | async"
								[ngClass]="{ 'selected': cat.id === category.value?.id }"
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
export class DuelsDesktopComponent extends AbstractSubscriptionComponent implements AfterContentInit, AfterViewInit {
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
			.pipe(
				map(([menuDisplayType]) => menuDisplayType),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting menuDisplayType in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.categories$ = this.store
			.listen$(([main, nav]) => main.duels.categories)
			.pipe(
				map(([categories]) => categories ?? []),
				// Subcategories are not displayed in the menu
				map((categories) => categories.filter((cat) => !!cat.name)),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((info) => cdLog('emitting categories in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.category$ = this.store
			.listen$(
				([main, nav]) => main.duels,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				map(([duels, selectedCategoryId]) => duels.findCategory(selectedCategoryId)),
				filter((category) => !!category),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting category in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectCategory(categoryId: DuelsCategoryType) {
		this.stateUpdater.next(new DuelsSelectCategoryEvent(categoryId));
	}
}
