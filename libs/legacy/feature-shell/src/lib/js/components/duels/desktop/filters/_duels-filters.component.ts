import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { Preferences } from '@models/preferences';
import { GenericPreferencesUpdateEvent } from '@services/mainwindow/store/events/generic-preferences-update-event';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DuelsStateBuilderService } from '../../../../services/duels/duels-state-builder.service';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsToggleShowHiddenPersonalDecksEvent } from '../../../../services/mainwindow/store/events/duels/duels-toggle-show-hidden-personal-decks-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'duels-filters',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/duels/desktop/filters/_duels-filters.component.scss`,
	],
	template: `
		<div class="filters duels-filters">
			<region-filter-dropdown class="filter" *ngIf="showRegionFilter$ | async"></region-filter-dropdown>
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
			<duels-hero-filter-dropdown class="filter class-filter"></duels-hero-filter-dropdown>
			<duels-hero-power-filter-dropdown class="filter hero-power-filter"></duels-hero-power-filter-dropdown>
			<duels-signature-treasure-filter-dropdown
				class="filter signature-treasure-filter"
			></duels-signature-treasure-filter-dropdown>
			<duels-dust-filter-dropdown class="filter dust-filter"></duels-dust-filter-dropdown>
			<duels-passive-filter-dropdown class="filter dust-filter"></duels-passive-filter-dropdown>
			<duels-hero-sort-dropdown class="filter hero-sort"></duels-hero-sort-dropdown>
			<duels-deck-sort-dropdown class="filter deck-sort"></duels-deck-sort-dropdown>

			<preference-toggle
				class="show-hidden-decks-link"
				*ngIf="showHiddenDecksLink$ | async"
				field="duelsPersonalDeckShowHiddenDecks"
				[label]="'settings.duels.personal-decks-show-hidden-decks' | owTranslate"
				[toggleFunction]="toggleShowHiddenDecks"
			></preference-toggle>
			<preference-toggle
				class="hide-below-threshold-link"
				*ngIf="showHideBelowThresholdLink$ | async"
				field="duelsHideStatsBelowThreshold"
				[label]="'settings.duels.hide-stats-below-threshold' | owTranslate"
				[helpTooltip]="helpTooltip"
				[toggleFunction]="toggleShowLowData"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsFiltersComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	threshold = DuelsStateBuilderService.STATS_THRESHOLD;

	showRegionFilter$: Observable<boolean>;
	showHiddenDecksLink$: Observable<boolean>;
	showHideBelowThresholdLink$: Observable<boolean>;

	helpTooltip = this.i18n.translateString('settings.duels.hide-stats-below-threshold-tooltip', {
		value: this.threshold,
	});

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showRegionFilter$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationDuels.selectedCategoryId)
			.pipe(
				filter(([currentView]) => !!currentView),
				this.mapData(
					([currentView]) =>
						currentView !== 'duels-deckbuilder' &&
						currentView !== 'duels-top-decks' &&
						currentView !== 'duels-leaderboard' &&
						currentView !== 'duels-buckets',
				),
			);
		this.showHiddenDecksLink$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.duelsPersonalDeckHiddenDeckCodes,
				([main, nav, prefs]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				this.mapData(([hiddenCodes, selectedCategoryId]) => {
					const result = !!hiddenCodes?.length && selectedCategoryId === 'duels-personal-decks';
					return result;
				}),
			);
		this.showHideBelowThresholdLink$ = this.store
			.listen$(([main, nav]) => nav.navigationDuels.selectedCategoryId)
			.pipe(
				this.mapData(([selectedCategoryId]) => ['duels-stats', 'duels-treasures'].includes(selectedCategoryId)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	toggleShowHiddenDecks = (newValue: boolean) => {
		this.stateUpdater.next(new DuelsToggleShowHiddenPersonalDecksEvent(newValue));
	};

	toggleShowLowData = (newValue: boolean) => {
		this.stateUpdater.next(
			new GenericPreferencesUpdateEvent(
				(prefs: Preferences) =>
					({
						...prefs,
						duelsHideStatsBelowThreshold: newValue,
					} as Preferences),
			),
		);
	};
}
