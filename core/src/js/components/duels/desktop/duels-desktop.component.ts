import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, tap } from 'rxjs/operators';
import { DuelsCategory } from '../../../models/mainwindow/duels/duels-category';
import { DuelsCategoryType } from '../../../models/mainwindow/duels/duels-category.type';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { AppUiStoreService, cdLog } from '../../../services/app-ui-store.service';
import { DuelsSelectCategoryEvent } from '../../../services/mainwindow/store/events/duels/duels-select-category-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { arraysEqual } from '../../../services/utils';

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
						<duels-filters [state]="state" [navigation]="navigation"> </duels-filters>
						<duels-runs-list
							*ngxCacheIf="category.value?.id === 'duels-runs'"
							[state]="state.duels"
							[navigation]="navigation.navigationDuels"
						>
						</duels-runs-list>
						<!-- Hero stats. Different component instances to improve caching -->
						<duels-hero-stats
							*ngxCacheIf="
								category.value?.id === 'duels-stats' && state.duels?.activeStatTypeFilter === 'hero'
							"
							[state]="state.duels"
							[statType]="'hero'"
							[navigation]="navigation.navigationDuels"
						>
						</duels-hero-stats>
						<duels-hero-stats
							*ngxCacheIf="
								category.value?.id === 'duels-stats' &&
								state.duels?.activeStatTypeFilter === 'hero-power'
							"
							[state]="state.duels"
							[statType]="'hero-power'"
							[navigation]="navigation.navigationDuels"
						>
						</duels-hero-stats>
						<duels-hero-stats
							*ngxCacheIf="
								category.value?.id === 'duels-stats' &&
								state.duels?.activeStatTypeFilter === 'signature-treasure'
							"
							[state]="state.duels"
							[statType]="'signature-treasure'"
							[navigation]="navigation.navigationDuels"
						>
						</duels-hero-stats>
						<!-- Treasure stats. Different component instances to improve caching -->
						<duels-treasure-stats
							*ngxCacheIf="
								category.value?.id === 'duels-treasures' &&
								['treasure-1', 'treasure-2', 'treasure-3'].includes(
									state.duels?.activeTreasureStatTypeFilter
								)
							"
							[state]="state.duels"
							[statType]="state.duels?.activeTreasureStatTypeFilter"
							[navigation]="navigation.navigationDuels"
						>
						</duels-treasure-stats>
						<duels-treasure-stats
							*ngxCacheIf="
								category.value?.id === 'duels-treasures' &&
								['passive-1', 'passive-2', 'passive-3'].includes(
									state.duels?.activeTreasureStatTypeFilter
								)
							"
							[state]="state.duels"
							[statType]="state.duels?.activeTreasureStatTypeFilter"
							[navigation]="navigation.navigationDuels"
						>
						</duels-treasure-stats>
						<duels-personal-decks
							*ngxCacheIf="category.value?.id === 'duels-personal-decks'"
							[state]="state.duels"
						>
						</duels-personal-decks>
						<duels-personal-deck-details
							*ngxCacheIf="
								category.value?.id === 'duels-personal-deck-details' ||
								category.value?.id === 'duels-deck-details'
							"
							[state]="state"
							[navigation]="navigation.navigationDuels"
						>
						</duels-personal-deck-details>
						<duels-top-decks *ngxCacheIf="category.value?.id === 'duels-top-decks'" [state]="state.duels">
						</duels-top-decks>
						<duels-leaderboard *ngxCacheIf="category.value?.id === 'duels-leaderboard'"></duels-leaderboard>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<duels-hero-search
					*ngxCacheIf="category.value?.id === 'duels-stats'"
					[navigation]="navigation.navigationDuels"
				></duels-hero-search>
				<duels-treasure-search
					*ngxCacheIf="category.value?.id === 'duels-treasures'"
					[navigation]="navigation.navigationDuels"
				></duels-treasure-search>

				<duels-classes-recap
					*ngxCacheIf="category.value?.id === 'duels-runs'"
					[state]="state.duels"
				></duels-classes-recap>
				<duels-replays-recap
					*ngxCacheIf="category.value?.id === 'duels-personal-decks'"
					[state]="state"
				></duels-replays-recap>
				<duels-treasure-tier-list
					*ngxCacheIf="category.value?.id === 'duels-treasures'"
					[state]="state.duels"
				></duels-treasure-tier-list>
				<duels-hero-tier-list
					*ngxCacheIf="category.value?.id === 'duels-stats'"
					[state]="state.duels"
				></duels-hero-tier-list>
				<duels-deck-stats
					*ngxCacheIf="
						category.value?.id === 'duels-personal-deck-details' ||
						category.value?.id === 'duels-deck-details'
					"
					[state]="state.duels"
					[navigation]="navigation.navigationDuels"
				></duels-deck-stats>
				<secondary-default *ngxCacheIf="category.value?.id === 'duels-top-decks'"></secondary-default>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDesktopComponent implements AfterViewInit {
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	categories$: Observable<readonly DuelsCategory[]>;
	category$: Observable<DuelsCategory>;

	@Input() state: MainWindowState;
	@Input() navigation: NavigationState;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.loading$ = this.store
			.listen$(([main, nav]) => main.duels.loading)
			.pipe(
				map(([loading]) => loading),
				distinctUntilChanged(),
				startWith(true),
				tap((info) => cdLog('emitting loading in ', this.constructor.name, info)),
			);
		this.menuDisplayType$ = this.store
			.listen$(([main, nav]) => nav.navigationDuels.menuDisplayType)
			.pipe(
				map(([menuDisplayType]) => menuDisplayType),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting menuDisplayType in ', this.constructor.name, info)),
			);
		this.categories$ = this.store
			.listen$(([main, nav]) => main.duels.categories)
			.pipe(
				map(([categories]) => categories ?? []),
				// Subcategories are not displayed in the menu
				map((categories) => categories.filter((cat) => !!cat.name)),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((info) => cdLog('emitting categories in ', this.constructor.name, info)),
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
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectCategory(categoryId: DuelsCategoryType) {
		this.stateUpdater.next(new DuelsSelectCategoryEvent(categoryId));
	}
}
