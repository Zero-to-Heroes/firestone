import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../services/duels/duels-state-builder.service';
import { DuelsToggleShowHiddenPersonalDecksEvent } from '../../../../services/mainwindow/store/events/duels/duels-toggle-show-hidden-personal-decks-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { PreferencesService } from '../../../../services/preferences.service';
import { DuelsDropdownOption } from './duels-dropdown-option';
import { DuelsGameModeSortFilterOption } from './duels-game-mode-sort-filter-option';
import { DuelsHeroFilterOption } from './duels-hero-filter-option';
import { DuelsMmrFilterOption } from './duels-mmr-filter-option';
import { DuelsStatTypeOption } from './duels-stat-type-option';
import { DuelsTimeSortFilterOption } from './duels-time-sort-filter-option';
import { DuelsClassFilterOption } from './duels-top-decks-class-filter-option';
import { DuelsTopDecksDustFilterOption } from './duels-top-decks-dust-filter-option';
import { DuelsTreasurePassiveTypeOption } from './duels-treasure-passive-type-option';
import { DuelsTreasureSortOption } from './duels-treasure-sort-option';

@Component({
	selector: 'duels-filters',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/duels/desktop/filters/_duels-filters.component.scss`,
	],
	template: `
		<div class="filters duels-filters" *ngIf="anyVisible()">
			<!-- <duels-game-mode-filter-dropdown class="game-mode-filter"></duels-game-mode-filter-dropdown> -->

			<duels-filter-dropdown
				*ngFor="let option of options"
				class="{{ option.class }}"
				[option]="option.option"
				[state]="_state"
				[navigation]="_navigation"
			></duels-filter-dropdown>
			<preference-toggle
				class="show-hidden-decks-link"
				*ngIf="showHiddenDecksLink"
				field="duelsPersonalDeckShowHiddenDecks"
				label="Show archived"
				[toggleFunction]="toggleShowHiddenDecks"
			></preference-toggle>
			<preference-toggle
				class="hide-below-threshold-link"
				*ngIf="showHideBelowThresholdLink"
				field="duelsHideStatsBelowThreshold"
				label="Hide low data"
				[helpTooltip]="'Hide stats with fewer than ' + threshold + 'data points'"
				[toggleFunction]="toggleShowHiddenDecks"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsFiltersComponent implements AfterViewInit {
	threshold = DuelsStateBuilderService.STATS_THRESHOLD;

	@Input() set state(value: MainWindowState) {
		this._state = value;
		this.doSetValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.doSetValues();
	}

	_state: MainWindowState;
	_navigation: NavigationState;

	showHiddenDecksLink: boolean;
	showHideBelowThresholdLink: boolean;
	options: readonly InternalOption[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	anyVisible() {
		return this.options.some((option) => option.option.visibleHandler(this._navigation, this._state));
	}

	toggleShowHiddenDecks = (newValue: boolean) => {
		this.stateUpdater.next(new DuelsToggleShowHiddenPersonalDecksEvent(newValue));
	};

	private async doSetValues() {
		if (!this._state || !this._navigation) {
			return;
		}
		this.options = [
			{ class: 'game-mode-sort-filter', option: new DuelsGameModeSortFilterOption() } as InternalOption,
			{ class: 'treasure-sort-filter', option: new DuelsTreasureSortOption() } as InternalOption,
			{ class: 'stat-type-filter', option: new DuelsStatTypeOption() } as InternalOption,
			{ class: 'treasure-passive-type-filter', option: new DuelsTreasurePassiveTypeOption() } as InternalOption,
			{ class: 'hero-sort-filter', option: new DuelsHeroFilterOption() } as InternalOption,
			{ class: 'time-sort-filter', option: new DuelsTimeSortFilterOption() } as InternalOption,
			{ class: 'class-filter', option: new DuelsClassFilterOption() } as InternalOption,
			{ class: 'top-decks-dust-filter', option: new DuelsTopDecksDustFilterOption() } as InternalOption,
			{ class: 'mmr-filter', option: new DuelsMmrFilterOption() } as InternalOption,
		];
		const prefs = await this.prefs.getPreferences();
		this.showHiddenDecksLink =
			this._state &&
			prefs.duelsPersonalDeckHiddenDeckCodes &&
			prefs.duelsPersonalDeckHiddenDeckCodes.length > 0 &&
			this._navigation &&
			this._navigation.currentApp == 'duels' &&
			this._navigation.navigationDuels.selectedCategoryId === 'duels-personal-decks';
		this.showHideBelowThresholdLink =
			this._state &&
			this._navigation &&
			this._navigation.currentApp == 'duels' &&
			['duels-stats', 'duels-treasures'].includes(this._navigation.navigationDuels.selectedCategoryId);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface InternalOption {
	class: string;
	option: DuelsDropdownOption;
}
