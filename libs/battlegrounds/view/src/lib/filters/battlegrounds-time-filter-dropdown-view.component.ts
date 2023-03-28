import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
	selector: 'battlegrounds-time-filter-dropdown-view',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-time-filter-dropdown"
			[options]="options$ | async"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTimeFilterDropdownViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options$: Observable<TimeFilterOption[]>;
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	@Output() valueSelected = new EventEmitter<TimeFilterOption>();

	@Input() set timePeriods(value: readonly BgsActiveTimeFilterType[]) {
		this.timePeriods$$.next(value);
	}
	@Input() set currentFilter(value: BgsActiveTimeFilterType) {
		this.currentFilter$$.next(value);
	}
	@Input() set visible(value: boolean) {
		this.visible$$.next(value);
	}

	private timePeriods$$ = new BehaviorSubject<readonly BgsActiveTimeFilterType[]>([]);
	private currentFilter$$ = new BehaviorSubject<BgsActiveTimeFilterType>(null);
	private visible$$ = new BehaviorSubject<boolean>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.options$ = this.timePeriods$$.pipe(
			filter((periods) => !!periods?.length),
			this.mapData((periods) =>
				periods.map(
					(period) =>
						({
							value: '' + period,
							label: getBgsTimeFilterLabelFor(period, this.i18n),
						} as TimeFilterOption),
				),
			),
		);
		this.filter$ = combineLatest([this.options$, this.currentFilter$$, this.visible$$]).pipe(
			filter(([options, currentFilter, visible]) => !!currentFilter),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([options, currentFilter, visible]) => ({
				filter: '' + currentFilter,
				placeholder: options.find((option) => option.value === currentFilter)?.label ?? options[0].label,
				visible: visible,
			})),
		);
	}

	onSelected(option: IOption) {
		this.valueSelected.next(option as TimeFilterOption);
	}
}

export interface TimeFilterOption extends IOption {
	value: BgsActiveTimeFilterType;
}

export const getBgsTimeFilterLabelFor = (filter: BgsActiveTimeFilterType, i18n: ILocalizationService): string => {
	switch (filter) {
		case 'past-seven':
		case 'past-three':
		case 'last-patch':
			return i18n.translateString(`app.battlegrounds.filters.time.${filter}`);
		case 'all-time':
		default:
			// TODO: in the personal stats, the value should be "all time"
			return i18n.translateString(`app.battlegrounds.filters.time.past-30`);
	}
};
