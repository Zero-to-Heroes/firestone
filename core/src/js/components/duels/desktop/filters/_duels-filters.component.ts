import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { DuelsStateBuilderService } from '../../../../services/duels/duels-state-builder.service';
import { DuelsToggleShowHiddenPersonalDecksEvent } from '../../../../services/mainwindow/store/events/duels/duels-toggle-show-hidden-personal-decks-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-filters',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/duels/desktop/filters/_duels-filters.component.scss`,
	],
	template: `
		<div class="filters duels-filters">
			<duels-treasures-sort-dropdown class="filter treasures-sort"></duels-treasures-sort-dropdown>
			<duels-stat-type-filter-dropdown class="filter stat-type-filter"></duels-stat-type-filter-dropdown>
			<duels-game-mode-filter-dropdown class="filter game-mode-filter"></duels-game-mode-filter-dropdown>
			<duels-leaderboard-game-mode-filter-dropdown
				class="filter game-leaderboard-mode-filter"
			></duels-leaderboard-game-mode-filter-dropdown>
			<duels-treasure-passive-type-filter-dropdown
				class="filter treasure-passive-type-filter"
			></duels-treasure-passive-type-filter-dropdown>
			<duels-mmr-filter-dropdown class="filter mmr-filter"></duels-mmr-filter-dropdown>
			<duels-time-filter-dropdown class="filter time-filter"></duels-time-filter-dropdown>
			<duels-class-filter-dropdown class="filter class-filter"></duels-class-filter-dropdown>
			<duels-hero-power-filter-dropdown class="filter hero-power-filter"></duels-hero-power-filter-dropdown>
			<duels-signature-treasure-filter-dropdown
				class="filter signature-treasure-filter"
			></duels-signature-treasure-filter-dropdown>
			<duels-dust-filter-dropdown class="filter dust-filter"></duels-dust-filter-dropdown>
			<duels-hero-sort-dropdown class="filter hero-sort"></duels-hero-sort-dropdown>

			<preference-toggle
				class="show-hidden-decks-link"
				*ngIf="showHiddenDecksLink$ | async"
				field="duelsPersonalDeckShowHiddenDecks"
				label="Show archived"
				[toggleFunction]="toggleShowHiddenDecks"
			></preference-toggle>
			<preference-toggle
				class="hide-below-threshold-link"
				*ngIf="showHideBelowThresholdLink$ | async"
				field="duelsHideStatsBelowThreshold"
				label="Hide low data"
				[helpTooltip]="'Hide stats with fewer than ' + threshold + ' data points'"
				[toggleFunction]="toggleShowHiddenDecks"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsFiltersComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	threshold = DuelsStateBuilderService.STATS_THRESHOLD;

	showHiddenDecksLink$: Observable<boolean>;
	showHideBelowThresholdLink$: Observable<boolean>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreFacadeService) {
		super();
		this.showHiddenDecksLink$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.duelsPersonalDeckHiddenDeckCodes,
				([main, nav, prefs]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				filter(([hiddenCodes, selectedCategoryId]) => !!hiddenCodes && !!selectedCategoryId),
				map(
					([hiddenCodes, selectedCategoryId]) =>
						hiddenCodes.length > 0 && selectedCategoryId === 'duels-personal-decks',
				),
				distinctUntilChanged(),
				tap((filter) => cdLog('emitting showHiddenDecksLink in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
		this.showHideBelowThresholdLink$ = this.store
			.listen$(([main, nav]) => nav.navigationDuels.selectedCategoryId)
			.pipe(
				filter(([selectedCategoryId]) => !!selectedCategoryId),
				map(([selectedCategoryId]) => ['duels-stats', 'duels-treasures'].includes(selectedCategoryId)),
				distinctUntilChanged(),
				tap((filter) => cdLog('emitting showHideBelowThresholdLink in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	toggleShowHiddenDecks = (newValue: boolean) => {
		this.stateUpdater.next(new DuelsToggleShowHiddenPersonalDecksEvent(newValue));
	};
}
