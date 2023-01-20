import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { IOption } from 'ng-select';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { BgsRankFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { BgsRankFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-rank-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

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
export class BattlegroundsRankFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	options$: Observable<RankFilterOption[]>;
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

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
		this.options$ = this.store
			.listen$(([main, nav, prefs]) => main.battlegrounds.globalStats?.mmrPercentiles)
			.pipe(
				filter(([mmrPercentiles]) => !!mmrPercentiles?.length),
				this.mapData(([mmrPercentiles]) =>
					mmrPercentiles
						// Not enough data for the top 1% yet
						.filter((percentile) => percentile.percentile > 1)
						.map(
							(percentile) =>
								({
									value: '' + percentile.percentile,
									label: getBgsRankFilterLabelFor(percentile, this.i18n),
								} as RankFilterOption),
						),
				),
			);
		this.filter$ = combineLatest(
			this.options$,
			this.store.listen$(
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
				([main, nav]) => nav.navigationBattlegrounds.currentView,
			),
		).pipe(
			filter(([options, [filter, categoryId, currentView]]) => !!filter && !!categoryId && !!currentView),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([options, [filter, categoryId, currentView]]) => ({
				filter: '' + filter,
				placeholder: options.find((option) => +option.value === filter)?.label ?? options[0].label,
				visible:
					!['categories', 'category'].includes(currentView) &&
					!['bgs-category-personal-stats', 'bgs-category-simulator', 'bgs-category-personal-rating'].includes(
						categoryId,
					),
			})),
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

export const getBgsRankFilterLabelFor = (percentile: MmrPercentile, i18n: LocalizationFacadeService): string => {
	if (!percentile) {
		return i18n.translateString('app.battlegrounds.filters.rank.all');
	}

	switch (percentile.percentile) {
		case 100:
			return i18n.translateString('app.battlegrounds.filters.rank.all');
		case 50:
		case 25:
		case 10:
		case 1:
			return i18n.translateString('app.battlegrounds.filters.rank.percentile', {
				percentile: percentile.percentile,
				mmr: getNiceMmrValue(percentile.mmr, 2),
			});
	}
};

const getNiceMmrValue = (mmr: number, significantDigit: number) => {
	return Math.pow(10, significantDigit) * Math.round(mmr / Math.pow(10, significantDigit));
};
