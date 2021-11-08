import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { MmrGroupFilterType } from '../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { BgsMmrGroupFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-mmr-group-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-rank-group-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-rank-group-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsRankGroupDropdownComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	options: readonly MmrGroupFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {
		super();
		this.options = [
			{
				value: 'per-match',
				label: 'Show each match',
			} as MmrGroupFilterOption,
			{
				value: 'per-day',
				label: 'Group per day',
				tooltip: 'Show the rating at the start of each day',
			} as MmrGroupFilterOption,
		] as readonly MmrGroupFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.bgsActiveMmrGroupFilter,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: selectedCategoryId === 'bgs-category-personal-rating',
				})),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: MmrGroupFilterOption) {
		this.stateUpdater.next(new BgsMmrGroupFilterSelectedEvent(option.value));
	}
}

interface MmrGroupFilterOption extends IOption {
	value: MmrGroupFilterType;
}
