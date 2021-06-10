import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { IOption } from 'ng-select';
import { BgsActiveTimeFilterType } from '../../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from '../../../models/mainwindow/battlegrounds/bgs-hero-sort-filter.type';
import { BgsRankFilterType } from '../../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { MmrGroupFilterType } from '../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { BgsHeroFilterSelectedEvent } from '../../../services/mainwindow/store/events/battlegrounds/bgs-hero-filter-selected-event';
import { BgsHeroSortFilterSelectedEvent } from '../../../services/mainwindow/store/events/battlegrounds/bgs-hero-sort-filter-selected-event';
import { BgsMmrGroupFilterSelectedEvent } from '../../../services/mainwindow/store/events/battlegrounds/bgs-mmr-group-filter-selected-event';
import { BgsRankFilterSelectedEvent } from '../../../services/mainwindow/store/events/battlegrounds/bgs-rank-filter-selected-event';
import { BgsTimeFilterSelectedEvent } from '../../../services/mainwindow/store/events/battlegrounds/bgs-time-filter-selected-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { formatPatch } from '../../../services/utils';

const collator = new Intl.Collator('en-US');

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
				[checkVisibleHandler]="heroSortVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectHeroSortFilter($event)"
			></fs-filter-dropdown>
			<fs-filter-dropdown
				class="hero-filter"
				[options]="heroFilterOptions"
				[filter]="activeHeroFilter"
				[checkVisibleHandler]="heroVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectHeroFilter($event)"
			></fs-filter-dropdown>
			<fs-filter-dropdown
				class="rank-filter"
				[options]="rankFilterOptions"
				[filter]="activeRankFilter"
				[checkVisibleHandler]="rankVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectRankFilter($event)"
			></fs-filter-dropdown>
			<fs-filter-dropdown
				class="mmr-group-filter"
				[options]="mmrGroupFilterOptions"
				[filter]="activeMmrGroupFilter"
				[checkVisibleHandler]="mmrGroupVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectMmrGroupFilter($event)"
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
		{
			value: 'last-played',
			label: 'Last played',
		} as HeroSortFilterOption,
	] as readonly HeroSortFilterOption[];
	activeHeroSortFilter: BgsHeroSortFilterType;
	heroSortFilterVisible: boolean;
	heroSortVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
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

	heroFilterOptions: readonly HeroFilterOption[] = [
		{
			value: 'all',
			label: 'All heroes',
		} as HeroFilterOption,
		...this.allCards
			.getCards()
			.filter((card) => card.battlegroundsHero)
			.map(
				(card) =>
					({
						label: card.name,
						value: card.id,
					} as HeroFilterOption),
			)
			.sort((a, b) => collator.compare(a.label, b.label)),
	] as readonly HeroFilterOption[];
	activeHeroFilter: string;
	heroFilterVisible: boolean;
	heroVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'battlegrounds' &&
			navigation.navigationBattlegrounds &&
			['bgs-category-perfect-games'].includes(navigation.navigationBattlegrounds.selectedCategoryId)
		);
	};

	mmrGroupFilterOptions: readonly MmrGroupFilterOption[] = [
		{
			value: 'per-match',
			label: 'Show each match',
		} as MmrGroupFilterOption,
		{
			value: 'per-day',
			label: 'Group per day',
			tooltip: 'Show the rating at the end of each day',
		} as MmrGroupFilterOption,
	] as readonly MmrGroupFilterOption[];
	activeMmrGroupFilter: MmrGroupFilterType;
	mmrGroupFilterVisible: boolean;
	mmrGroupVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'battlegrounds' &&
			navigation.navigationBattlegrounds &&
			['bgs-category-personal-rating'].includes(navigation.navigationBattlegrounds.selectedCategoryId)
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
			!['bgs-category-personal-stats', 'bgs-category-perfect-games'].includes(
				navigation.navigationBattlegrounds.selectedCategoryId,
			)
		);
	};
	timeOptionsBuilder = (navigation: NavigationState, state: MainWindowState): readonly IOption[] => {
		//console.log('building time options', state);
		return [
			{
				value: 'all-time',
				label: 'Past 100 days',
			} as TimeFilterOption,
			{
				value: 'past-30',
				label: 'Past 30 days',
			} as TimeFilterOption,
			{
				value: 'past-7',
				label: 'Past 7 days',
			} as TimeFilterOption,
			{
				value: 'last-patch',
				label: `Last patch`,
				tooltip: formatPatch(state?.battlegrounds?.stats?.currentBattlegroundsMetaPatch),
			} as TimeFilterOption,
		] as readonly TimeFilterOption[];
	};

	rankFilterOptions: readonly RankFilterOption[] = [
		{
			value: 'all',
			label: 'All ranks',
		} as RankFilterOption,
		{
			value: '2000',
			label: '2,000+',
		} as RankFilterOption,
		{
			value: '4000',
			label: '4,000+',
		} as RankFilterOption,
		{
			value: '6000',
			label: '6,000+',
		} as RankFilterOption,
		{
			value: '8000',
			label: '8,000+',
		} as RankFilterOption,
		{
			value: '10000',
			label: '10,000+',
		} as RankFilterOption,
	] as readonly RankFilterOption[];
	activeRankFilter: BgsRankFilterType;
	rankFilterVisible: boolean;
	rankVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'battlegrounds' &&
			navigation.navigationBattlegrounds &&
			!['categories', 'category'].includes(navigation.navigationBattlegrounds.currentView) &&
			!['bgs-category-personal-stats'].includes(navigation.navigationBattlegrounds.selectedCategoryId)
		);
	};

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly allCards: AllCardsService,
	) {}

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

	selectHeroFilter(option: HeroFilterOption) {
		this.stateUpdater.next(new BgsHeroFilterSelectedEvent(option.value));
	}

	selectRankFilter(option: HeroSortFilterOption) {
		this.stateUpdater.next(new BgsRankFilterSelectedEvent(option.value));
	}

	selectMmrGroupFilter(option: MmrGroupFilterOption) {
		this.stateUpdater.next(new BgsMmrGroupFilterSelectedEvent(option.value));
	}

	anyVisible() {
		return (
			this.heroSortVisibleHandler(this._navigation, this._state) ||
			this.heroVisibleHandler(this._navigation, this._state) ||
			this.timeVisibleHandler(this._navigation, this._state) ||
			this.rankVisibleHandler(this._navigation, this._state) ||
			this.mmrGroupVisibleHandler(this._navigation, this._state)
		);
	}

	private doSetValues() {
		this.activeTimeFilter = this._state?.battlegrounds?.activeTimeFilter;
		this.activeHeroSortFilter = this._state.battlegrounds?.activeHeroSortFilter;
		this.activeHeroFilter = this._state.battlegrounds?.activeHeroFilter;
		this.activeRankFilter = this._state.battlegrounds?.activeRankFilter;
		this.activeMmrGroupFilter = this._state.battlegrounds?.activeGroupMmrFilter;
	}
}

interface TimeFilterOption extends IOption {
	value: BgsActiveTimeFilterType;
}

interface HeroSortFilterOption extends IOption {
	value: BgsHeroSortFilterType;
}

interface HeroFilterOption extends IOption {
	value: string;
}

interface RankFilterOption extends IOption {
	value: BgsRankFilterType;
}

interface MmrGroupFilterOption extends IOption {
	value: MmrGroupFilterType;
}
