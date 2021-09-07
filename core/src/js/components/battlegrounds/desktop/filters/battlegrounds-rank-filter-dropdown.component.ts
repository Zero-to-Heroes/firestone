import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { BgsRankFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { BgsRankFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-rank-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreService } from '../../../../services/ui-store/app-ui-store.service';

@Component({
	selector: 'battlegrounds-rank-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-rank-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsRankFilterDropdownComponent implements AfterViewInit {
	options: readonly RankFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.options = [
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
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
				([main, nav]) => nav.navigationBattlegrounds.currentView,
			)
			.pipe(
				filter(([filter, categoryId, currentView]) => !!filter && !!categoryId && !!currentView),
				map(([filter, categoryId, currentView]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible:
						!['categories', 'category'].includes(currentView) &&
						!['bgs-category-personal-stats', 'bgs-category-simulator'].includes(categoryId),
				})),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: RankFilterOption) {
		this.stateUpdater.next(new BgsRankFilterSelectedEvent(option.value));
	}
}

interface RankFilterOption extends IOption {
	value: BgsRankFilterType;
}
