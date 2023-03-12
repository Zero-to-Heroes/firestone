import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
	selector: 'battlegrounds-rank-filter-dropdown-view',
	styleUrls: [],
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
export class BattlegroundsRankFilterDropdownViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options$: Observable<RankFilterOption[]>;
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	@Output() valueSelected = new EventEmitter<RankFilterOption>();

	@Input() set mmrPercentiles(value: readonly MmrPercentile[]) {
		this.mmrPercentiles$$.next(value);
	}
	@Input() set currentFilter(value: number) {
		this.currentFilter$$.next(value);
	}
	@Input() set visible(value: boolean) {
		this.visible$$.next(value);
	}

	private mmrPercentiles$$ = new BehaviorSubject<readonly MmrPercentile[]>([]);
	private currentFilter$$ = new BehaviorSubject<number>(null);
	private visible$$ = new BehaviorSubject<boolean>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.options$ = this.mmrPercentiles$$.pipe(
			filter((mmrPercentiles) => !!mmrPercentiles?.length),
			this.mapData((mmrPercentiles) =>
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
		this.filter$ = combineLatest([this.options$, this.currentFilter$$, this.visible$$]).pipe(
			filter(([options, currentFilter, visible]) => !!currentFilter),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([options, currentFilter, visible]) => ({
				filter: '' + currentFilter,
				placeholder: options.find((option) => +option.value === currentFilter)?.label ?? options[0].label,
				visible: visible,
			})),
		);
	}

	onSelected(option: RankFilterOption) {
		this.valueSelected.next(option);
	}
}

export interface RankFilterOption extends IOption {
	value: string;
}

export const getBgsRankFilterLabelFor = (percentile: MmrPercentile, i18n: ILocalizationService): string => {
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
