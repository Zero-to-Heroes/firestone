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
import { DuelsHeroSortFilterType } from '../../../models/duels/duels-hero-sort-filter.type';
import { DuelsStatTypeFilterType } from '../../../models/duels/duels-stat-type-filter.type';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { DuelsHeroSortFilterSelectedEvent } from '../../../services/mainwindow/store/events/duels/duels-hero-sort-filter-selected-event';
import { DuelsStatTypeFilterSelectedEvent } from '../../../services/mainwindow/store/events/duels/duels-stat-type-filter-selected-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-filters',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/duels/desktop/duels-filters.component.scss`,
	],
	template: `
		<div class="duels-filters" *ngIf="anyVisible()">
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
				class="stat-type-filter"
				[options]="statTypeFilterOptions"
				[filter]="activeStatTypeFilter"
				[checkVisibleHandler]="statTypeVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectStatTypeFilter($event)"
			></fs-filter-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsFiltersComponent implements AfterViewInit {
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
			value: 'player-winrate',
			label: 'Your winrate',
		} as HeroSortFilterOption,
		{
			value: 'global-winrate',
			label: 'Global winrate',
		} as HeroSortFilterOption,
		{
			value: 'games-played',
			label: 'Games played',
		} as HeroSortFilterOption,
	] as readonly HeroSortFilterOption[];
	activeHeroSortFilter: DuelsHeroSortFilterType;
	heroSortFilterVisible: boolean;
	heroVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			navigation.navigationDuels.selectedCategoryId === 'duels-stats'
		);
	};

	statTypeFilterOptions: readonly StatTypeFilterOption[] = [
		{
			value: 'hero',
			label: 'Heroes',
		} as StatTypeFilterOption,
		{
			value: 'hero-power',
			label: 'Hero Powers',
		} as StatTypeFilterOption,
		{
			value: 'signature-treasure',
			label: 'Signature Treasures',
		} as StatTypeFilterOption,
	] as readonly StatTypeFilterOption[];
	activeStatTypeFilter: DuelsStatTypeFilterType;
	statTypeFilterVisible: boolean;
	statTypeVisibleHandler = this.heroVisibleHandler;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectHeroSortFilter(option: HeroSortFilterOption) {
		this.stateUpdater.next(new DuelsHeroSortFilterSelectedEvent(option.value));
	}

	selectStatTypeFilter(option: StatTypeFilterOption) {
		this.stateUpdater.next(new DuelsStatTypeFilterSelectedEvent(option.value));
	}

	anyVisible() {
		return this.heroVisibleHandler(this._navigation, this._state);
	}

	private doSetValues() {
		this.activeHeroSortFilter = this._state.duels?.activeHeroSortFilter;
		this.activeStatTypeFilter = this._state.duels?.activeStatTypeFilter;
		console.log('active filter', this.activeHeroSortFilter, this._state);
	}
}

interface HeroSortFilterOption extends IOption {
	value: DuelsHeroSortFilterType;
}

interface StatTypeFilterOption extends IOption {
	value: DuelsStatTypeFilterType;
}
