import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { IOption } from 'ng-select';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsRankFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { BgsRankFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-rank-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

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
			[options]="options$ | async"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsRankFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	options$: Observable<readonly RankFilterOption[]>;
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {
		super();
		this.options$ = this.store
			.listen$(([main, nav, prefs]) => main.battlegrounds.globalStats?.mmrPercentiles)
			.pipe(
				takeUntil(this.destroyed$),
				filter(([mmrPercentiles]) => !!mmrPercentiles?.length),
				map(([mmrPercentiles]) =>
					mmrPercentiles
						// Not enough data for the top 1% yet
						.filter((percentile) => percentile.percentile > 1)
						.map(
							(percentile) =>
								({
									value: '' + percentile.percentile,
									label: getBgsRankFilterLabelFor(percentile),
								} as RankFilterOption),
						),
				),
				// FIXME: Don't know why this is necessary, but without it, the filter doesn't update
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((filter) => cdLog('emitting rank filter in ', this.constructor.name, filter)),
			);
		this.filter$ = combineLatest(
			this.options$,
			this.store.listen$(
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
				([main, nav]) => nav.navigationBattlegrounds.currentView,
			),
		).pipe(
			takeUntil(this.destroyed$),
			filter(([options, [filter, categoryId, currentView]]) => !!filter && !!categoryId && !!currentView),
			map(([options, [filter, categoryId, currentView]]) => ({
				filter: '' + filter,
				placeholder: options.find((option) => +option.value === filter)?.label ?? options[0].label,
				visible:
					!['categories', 'category'].includes(currentView) &&
					!['bgs-category-personal-stats', 'bgs-category-simulator'].includes(categoryId),
			})),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
			// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
		);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: RankFilterOption) {
		this.stateUpdater.next(new BgsRankFilterSelectedEvent(+option.value as BgsRankFilterType));
	}
}

interface RankFilterOption extends IOption {
	value: string;
}

export const getBgsRankFilterLabelFor = (percentile: MmrPercentile): string => {
	if (!percentile) {
		return 'All ranks';
	}

	switch (percentile.percentile) {
		case 100:
			return 'All ranks';
		case 50:
			return `Top 50% (${getNiceMmrValue(percentile.mmr, 2)}+)`;
		case 25:
			return `Top 25% (${getNiceMmrValue(percentile.mmr, 2)}+)`;
		case 10:
			return `Top 10% (${getNiceMmrValue(percentile.mmr, 2)}+)`;
		case 1:
			return `Top 1% (${getNiceMmrValue(percentile.mmr, 1)}+)`;
	}
};

const getNiceMmrValue = (mmr: number, significantDigit: number) => {
	return Math.pow(10, significantDigit) * Math.round(mmr / Math.pow(10, significantDigit));
};
