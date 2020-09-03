import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { IOption } from 'ng-select';
import { BattlegroundsAppState } from '../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BgsActiveTimeFilterType } from '../../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from '../../../models/mainwindow/battlegrounds/bgs-hero-sort-filter.type';
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
			<ng-select
				class="filter hero-sort-filter"
				[ngClass]="{ 'disabled': !heroSortFilterVisible }"
				[options]="heroSortFilterOptions"
				[ngModel]="activeHeroSortFilter"
				[placeholder]="heroSortPlaceholder"
				(selected)="selectHeroSortFilter($event)"
				(opened)="refresh()"
				(closed)="refresh()"
				[noFilter]="1"
			>
				<ng-template #optionTemplate let-option="option">
					<span>{{ option?.label }}</span>
					<i class="i-30 selected-icon" *ngIf="option.value === activeHeroSortFilter">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#selected_dropdown" />
						</svg>
					</i>
				</ng-template>
			</ng-select>
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
							<use xlink:href="/Files/assets/svg/sprite.svg#selected_dropdown" />
						</svg>
					</i>
				</ng-template>
			</ng-select>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsFiltersComponent implements AfterViewInit {
	timeFilterOptions: readonly TimeFilterOption[];
	activeTimeFilter: BgsActiveTimeFilterType;
	placeholder: string;
	timeFilterVisible: boolean;

	heroSortFilterOptions: readonly HeroSortFilterOption[];
	activeHeroSortFilter: BgsHeroSortFilterType;
	heroSortPlaceholder: string;
	heroSortFilterVisible: boolean;

	_state: BattlegroundsAppState;
	_navigation: NavigationState;

	@Input() set state(value: BattlegroundsAppState) {
		this._state = value;
		this.doSetValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.doSetValues();
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly el: ElementRef,
	) {}

	refresh() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		const singleEls: HTMLElement[] = this.el.nativeElement.querySelectorAll('.single');
		console.log('updating filter visuals', singleEls);
		singleEls.forEach(singleEl => {
			const caretEl = singleEl.appendChild(document.createElement('i'));
			caretEl.innerHTML = `<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#arrow"/>
				</svg>`;
			caretEl.classList.add('i-30');
			caretEl.classList.add('caret');
		});
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
			this.heroSortFilterVisible = false;
			return;
		}
		if (this._navigation.currentApp !== 'battlegrounds') {
			this.timeFilterVisible = false;
			this.heroSortFilterVisible = false;
			return;
		}

		if (['categories', 'category'].includes(this._navigation.navigationBattlegrounds.currentView)) {
			this.timeFilterVisible = false;
			this.heroSortFilterVisible = false;
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
				label: `Last patch (${this._state.stats.currentBattlegroundsMetaPatch})`,
			} as TimeFilterOption,
		] as readonly TimeFilterOption[];
		this.activeTimeFilter = this._state.activeTimeFilter;
		this.placeholder = this.timeFilterOptions.find(option => option.value === this.activeTimeFilter).label;

		this.updateHeroSortFilter();
		return;
	}

	private updateHeroSortFilter() {
		if (this._navigation.navigationBattlegrounds.selectedCategoryId !== 'bgs-category-personal-heroes') {
			this.heroSortFilterVisible = false;
			return;
		}
		this.heroSortFilterVisible = true;
		this.heroSortFilterOptions = [
			{
				value: 'average-position',
				label: 'Average position',
			} as HeroSortFilterOption,
			{
				value: 'games-played',
				label: 'Games played',
			} as HeroSortFilterOption,
		] as readonly HeroSortFilterOption[];
		this.activeHeroSortFilter = this._state.activeHeroSortFilter;
		this.heroSortPlaceholder = this.heroSortFilterOptions.find(
			option => option.value === this.activeHeroSortFilter,
		).label;
	}
}

interface TimeFilterOption extends IOption {
	value: BgsActiveTimeFilterType;
}

interface HeroSortFilterOption extends IOption {
	value: BgsHeroSortFilterType;
}
