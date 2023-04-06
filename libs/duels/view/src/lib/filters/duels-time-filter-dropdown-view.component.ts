import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { getBgsTimeFilterLabelFor } from '@firestone/battlegrounds/view';
import { DuelsTimeFilterType } from '@firestone/duels/data-access';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
	selector: 'duels-time-filter-dropdown-view',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-time-filter-dropdown"
			[options]="options$ | async"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTimeFilterDropdownViewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	options$: Observable<TimeFilterOption[]>;
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	@Output() valueSelected = new EventEmitter<TimeFilterOption>();

	@Input() set timePeriods(value: readonly TimePeriod[] | null) {
		this.timePeriods$$.next(value ?? []);
	}
	@Input() set currentFilter(value: DuelsTimeFilterType | null) {
		this.currentFilter$$.next(value ?? 'last-patch');
	}
	@Input() set visible(value: boolean) {
		this.visible$$.next(value);
	}

	private timePeriods$$ = new BehaviorSubject<readonly TimePeriod[]>([]);
	private currentFilter$$ = new BehaviorSubject<DuelsTimeFilterType>('last-patch');
	private visible$$ = new BehaviorSubject<boolean>(false);

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
							value: '' + period.value,
							label: getBgsTimeFilterLabelFor(period.value, this.i18n),
							tooltip: period.tooltip,
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
	value: DuelsTimeFilterType;
}

export interface TimePeriod {
	value: DuelsTimeFilterType;
	tooltip?: string;
}
