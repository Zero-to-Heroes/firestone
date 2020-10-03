import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { IOption } from 'ng-select';
import { BgsActiveTimeFilterType } from '../../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from '../../../models/mainwindow/battlegrounds/bgs-hero-sort-filter.type';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { BgsHeroSortFilterSelectedEvent } from '../../../services/mainwindow/store/events/battlegrounds/bgs-hero-sort-filter-selected-event';
import { BgsTimeFilterSelectedEvent } from '../../../services/mainwindow/store/events/battlegrounds/bgs-time-filter-selected-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-filters',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/battlegrounds/desktop/battlegrounds-filters.component.scss`,
	],
	template: `
		<div class="battlegrounds-filters" *ngIf="anyVisible()">
			<fs-filter-dropdown
				class="hero-sort-filter"
				[options]="heroSortFilterOptions"
				[filter]="activeHeroSortFilter"
				[checkVisibleHandler]="heroVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectHeroSortFilter($event)"
			></fs-filter-dropdown>
			<fs-filter-dropdown
				class="time-filter"
				[filter]="activeTimeFilter"
				[checkVisibleHandler]="timeVisibleHandler"
				[optionsBuilder]="timeOptionsBuilder"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectTimeFilter($event)"
			></fs-filter-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsFiltersComponent implements AfterViewInit {
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

	heroSortFilterOptions: readonly HeroSortFilterOption[] = [
		{
			value: 'average-position',
			label: 'Average position',
		} as HeroSortFilterOption,
		{
			value: 'mmr',
			label: 'Net MMR',
		} as HeroSortFilterOption,
		{
			value: 'games-played',
			label: 'Games played',
		} as HeroSortFilterOption,
	] as readonly HeroSortFilterOption[];
	activeHeroSortFilter: BgsHeroSortFilterType;
	heroSortFilterVisible: boolean;
	heroVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'battlegrounds' &&
			navigation.navigationBattlegrounds &&
			navigation.navigationBattlegrounds.selectedCategoryId === 'bgs-category-personal-heroes' &&
			!['categories', 'category'].includes(navigation.navigationBattlegrounds.currentView) &&
			!['bgs-category-personal-stats'].includes(navigation.navigationBattlegrounds.selectedCategoryId)
		);
	};

	activeTimeFilter: BgsActiveTimeFilterType;
	timeFilterVisible: boolean;
	timeVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'battlegrounds' &&
			navigation.navigationBattlegrounds &&
			!['categories', 'category'].includes(navigation.navigationBattlegrounds.currentView) &&
			!['bgs-category-personal-stats'].includes(navigation.navigationBattlegrounds.selectedCategoryId)
		);
	};
	timeOptionsBuilder = (navigation: NavigationState, state: MainWindowState): readonly IOption[] => {
		return [
			{
				value: 'all-time',
				label: 'Past 100 days',
			} as TimeFilterOption,
			{
				value: 'last-patch',
				label: `Last patch (${state?.battlegrounds?.stats?.currentBattlegroundsMetaPatch})`,
			} as TimeFilterOption,
		] as readonly TimeFilterOption[];
	};

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectTimeFilter(option: TimeFilterOption) {
		this.stateUpdater.next(new BgsTimeFilterSelectedEvent(option.value));
	}

	selectHeroSortFilter(option: HeroSortFilterOption) {
		this.stateUpdater.next(new BgsHeroSortFilterSelectedEvent(option.value));
	}

	anyVisible() {
		return (
			this.heroVisibleHandler(this._navigation, this._state) ||
			this.timeVisibleHandler(this._navigation, this._state)
		);
	}

	private doSetValues() {
		this.activeTimeFilter = this._state?.battlegrounds?.activeTimeFilter;
		this.activeHeroSortFilter = this._state.battlegrounds?.activeHeroSortFilter;
	}
}

interface TimeFilterOption extends IOption {
	value: BgsActiveTimeFilterType;
}

interface HeroSortFilterOption extends IOption {
	value: BgsHeroSortFilterType;
}
