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
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, tap } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'battlegrounds-card-turn-filter-dropdown-view',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-card-turn-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCardTurnFilterDropdownViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: readonly CardTurnFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	@Output() valueSelected = new EventEmitter<CardTurnFilterOption>();

	@Input() set currentFilter(value: number | null) {
		this.currentFilter$$.next(value);
	}
	@Input() set visible(value: boolean) {
		this.visible$$.next(value);
	}

	private currentFilter$$ = new BehaviorSubject<number | null>(null);
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
				value: null,
				label: `All turns`,
				tooltip: 'When this is selected, card impact is hidden',
			} as IOption,
			...Array(10)
				.fill(0)
				.map((_, i) => i + 1)
				.map((turn) => ({
					value: turn.toString(),
					label: `Turn ${turn}`,
				})),
		];
		this.filter$ = combineLatest([this.currentFilter$$, this.visible$$]).pipe(
			tap(([currentFilter, visible]) => console.debug('[debug] currentFilter', currentFilter, visible)),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([currentFilter, visible]) => ({
				filter: currentFilter == null ? null : currentFilter.toString(),
				placeholder: this.options.find(
					(option) => (option.value === null && currentFilter == null) || +option.value === currentFilter,
				)?.label,
				visible: visible,
			})),
		);
	}

	onSelected(option: IOption) {
		this.valueSelected.next(option as CardTurnFilterOption);
	}
}

export interface CardTurnFilterOption extends IOption {
	value: string;
}
