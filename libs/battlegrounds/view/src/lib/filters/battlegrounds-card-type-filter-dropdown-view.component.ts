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
import { BgsCardTypeFilterType } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'battlegrounds-card-type-filter-dropdown-view',
	styleUrls: [],
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
export class BattlegroundsCardTypeFilterDropdownViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: IOption[];
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	@Output() valueSelected = new EventEmitter<BgsCardTypeFilterType>();

	@Input() set currentFilter(value: BgsCardTypeFilterType) {
		this.currentFilter$$.next(value);
	}
	@Input() set visible(value: boolean) {
		this.visible$$.next(value);
	}

	private currentFilter$$ = new BehaviorSubject<BgsCardTypeFilterType>(null);
	private visible$$ = new BehaviorSubject<boolean>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.options = [
			{
				value: 'minion',
				label: this.i18n.translateString('app.battlegrounds.filters.card-type.minion'),
			} as IOption,
			{
				value: 'spell',
				label: this.i18n.translateString('app.battlegrounds.filters.card-type.spell'),
			} as IOption,
		];
		this.filter$ = combineLatest([this.currentFilter$$, this.visible$$]).pipe(
			filter(([currentFilter, visible]) => !!currentFilter),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([currentFilter, visible]) => ({
				filter: '' + currentFilter,
				placeholder:
					this.options.find((option) => option.value === currentFilter)?.label ?? this.options[0].label,
				visible: visible,
			})),
		);
	}

	onSelected(option: IOption) {
		this.valueSelected.next(option.value as BgsCardTypeFilterType);
	}
}
