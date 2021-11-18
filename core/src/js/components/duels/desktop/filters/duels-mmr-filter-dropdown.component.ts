import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { MmrPercentile } from '@firestone-hs/duels-global-stats/dist/stat';
import { IOption } from 'ng-select';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { DuelsMmrFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-mmr-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-mmr-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-mmr-filter-dropdown"
			[options]="options$ | async"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsMmrFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	options$: Observable<readonly RankFilterOption[]>;
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.options$ = this.store
			.listen$(([main, nav, prefs]) => main.duels.globalStats?.mmrPercentiles)
			.pipe(
				filter(([mmrPercentiles]) => !!mmrPercentiles?.length),
				map(([mmrPercentiles]) =>
					mmrPercentiles.map(
						(percentile) =>
							({
								value: '' + percentile.percentile,
								label: this.buildPercentileLabel(percentile),
							} as RankFilterOption),
					),
				),
				// FIXME: Don't know why this is necessary, but without it, the filter doesn't update
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((filter) => cdLog('emitting rank filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
		this.filter$ = combineLatest(
			this.options$,
			this.store.listen$(
				([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			),
		).pipe(
			filter(([options, [filter, selectedCategoryId]]) => !!filter && !!selectedCategoryId),
			map(([options, [filter, selectedCategoryId]]) => {
				return {
					filter: '' + filter,
					placeholder: options.find((option) => option.value === '' + filter)?.label ?? options[0].label,
					visible: ['duels-stats', 'duels-treasures', 'duels-top-decks'].includes(selectedCategoryId),
				};
			}),
			// Don't know why this is necessary, but without it, the filter doesn't update
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting mmr filter in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: RankFilterOption) {
		console.debug('selected', option);
		this.stateUpdater.next(new DuelsMmrFilterSelectedEvent(+option.value as 100 | 50 | 25 | 10 | 1));
	}

	private buildPercentileLabel(percentile: MmrPercentile): string {
		switch (percentile.percentile) {
			case 100:
				return 'All ranks';
			case 50:
				return `Top 50% (${this.getNiceMmrValue(percentile.mmr, 2)}+)`;
			case 25:
				return `Top 25% (${this.getNiceMmrValue(percentile.mmr, 2)}+)`;
			case 10:
				return `Top 10% (${this.getNiceMmrValue(percentile.mmr, 2)}+)`;
			case 1:
				return `Top 1% (${this.getNiceMmrValue(percentile.mmr, 1)}+)`;
		}
	}

	private getNiceMmrValue(mmr: number, significantDigit: number) {
		return Math.pow(10, significantDigit) * Math.round(mmr / Math.pow(10, significantDigit));
	}
}

interface RankFilterOption extends IOption {
	value: string; // Actually a number that describes the percentile (100, 50, 1, etc.)
}
