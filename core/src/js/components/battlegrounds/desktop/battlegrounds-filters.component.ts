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
		<div class="battlegrounds-filters">
			<fs-filter-dropdown
				class="hero-sort-filter"
				[options]="heroSortFilterOptions"
				[filter]="activeHeroSortFilter"
				[placeholder]="heroSortPlaceholder"
				[checkVisibleHandler]="heroVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectHeroSortFilter($event)"
			></fs-filter-dropdown>
			<ng-select
				class="filter time-filter"
				[ngClass]="{ 'disabled': !timeFilterVisible }"
				[options]="timeFilterOptions"
				[ngModel]="activeTimeFilter"
				[placeholder]="placeholder"
				(selected)="selectTimeFilter($event)"
				(opened)="refresh()"
				(closed)="refresh()"
				[noFilter]="1"
			>
				<ng-template #optionTemplate let-option="option">
					<span>{{ option?.label }}</span>
					<i class="i-30 selected-icon" *ngIf="option.value === activeTimeFilter">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#selected_dropdown" />
						</svg>
					</i>
				</ng-template>
			</ng-select>
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

	timeFilterOptions: readonly TimeFilterOption[];
	activeTimeFilter: BgsActiveTimeFilterType;
	placeholder: string;
	timeFilterVisible: boolean;

	heroSortFilterOptions: readonly HeroSortFilterOption[];
	activeHeroSortFilter: BgsHeroSortFilterType;
	heroSortPlaceholder: string;
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

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService, // private readonly el: ElementRef,
	) {}

	refresh() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

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

	private doSetValues() {
		if (!this._navigation || !this._state || !this._navigation.navigationBattlegrounds) {
			this.timeFilterVisible = false;
			// this.heroSortFilterVisible = false;
			return;
		}
		if (this._navigation.currentApp !== 'battlegrounds') {
			this.timeFilterVisible = false;
			// this.heroSortFilterVisible = false;
			return;
		}

		if (
			['categories', 'category'].includes(this._navigation.navigationBattlegrounds.currentView) ||
			['bgs-category-personal-stats'].includes(this._navigation.navigationBattlegrounds.selectedCategoryId)
		) {
			this.timeFilterVisible = false;
			// this.heroSortFilterVisible = false;
			return;
		}

		this.timeFilterVisible = true;
		this.timeFilterOptions = [
			{
				value: 'all-time',
				label: 'Past 100 days',
			} as TimeFilterOption,
			{
				value: 'last-patch',
				label: `Last patch (${this._state?.battlegrounds?.stats?.currentBattlegroundsMetaPatch})`,
			} as TimeFilterOption,
		] as readonly TimeFilterOption[];
		this.activeTimeFilter = this._state?.battlegrounds?.activeTimeFilter;
		// console.log('set time filter', this.activeTimeFilter, this.timeFilterOptions);
		this.placeholder = this.timeFilterOptions.find(option => option.value === this.activeTimeFilter)?.label;

		this.updateHeroSortFilter();
		return;
	}

	private updateHeroSortFilter() {
		// if (this._navigation.navigationBattlegrounds.selectedCategoryId !== 'bgs-category-personal-heroes') {
		// 	this.heroSortFilterVisible = false;
		// 	return;
		// }
		this.heroSortFilterVisible = true;
		this.heroSortFilterOptions = [
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
		this.activeHeroSortFilter = this._state.battlegrounds?.activeHeroSortFilter;
		this.heroSortPlaceholder = this.heroSortFilterOptions.find(
			option => option.value === this.activeHeroSortFilter,
		)?.label;
	}
}

interface TimeFilterOption extends IOption {
	value: BgsActiveTimeFilterType;
}

interface HeroSortFilterOption extends IOption {
	value: BgsHeroSortFilterType;
}
