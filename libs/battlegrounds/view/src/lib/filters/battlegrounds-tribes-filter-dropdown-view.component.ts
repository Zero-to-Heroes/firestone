import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { getTribeIcon, getTribeName, Race } from '@firestone-hs/reference-data';
import { MultiselectOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
	selector: 'battlegrounds-tribes-filter-dropdown-view',
	styleUrls: [],
	template: `
		<filter-dropdown-multiselect
			*ngIf="filter$ | async as value"
			class="battlegrounds-tribes-filter-dropdown"
			[options]="options$ | async"
			[selected]="value.selected"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			[validationErrorTooltip]="validationErrorTooltip"
			(optionSelected)="onSelected($event)"
		></filter-dropdown-multiselect>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTribesFilterDropdownViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options$: Observable<readonly MultiselectOption[]>;
	filter$: Observable<{ selected: readonly string[]; placeholder: string; visible: boolean }>;

	@Output() valueSelected = new EventEmitter<readonly Race[]>();

	@Input() set allTribes(value: readonly Race[]) {
		this.allTribes$$.next(value);
	}
	@Input() set currentFilter(value: readonly Race[]) {
		this.currentFilter$$.next(value);
	}
	@Input() set visible(value: boolean) {
		this.visible$$.next(value);
	}

	@Input() validationErrorTooltip = this.i18n.translateString(
		'app.battlegrounds.filters.tribe.validation-error-tooltip',
	);

	private allTribes$$ = new BehaviorSubject<readonly Race[]>([]);
	private currentFilter$$ = new BehaviorSubject<readonly Race[]>([]);
	private visible$$ = new BehaviorSubject<boolean>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.options$ = this.allTribes$$.pipe(
			filter((allTribes) => !!allTribes?.length),
			this.mapData((allTribes) => {
				const result = allTribes
					.map(
						(tribe) =>
							({
								value: '' + tribe,
								label: getTribeName(tribe, this.i18n),
								image: getTribeIcon(tribe),
							} as MultiselectOption),
					)
					.sort((a, b) => (a.label < b.label ? -1 : 1));
				console.debug('options', result);
				return result;
			}),
		);
		this.filter$ = combineLatest([this.options$, this.currentFilter$$, this.visible$$]).pipe(
			filter(([options, currentFilter, visible]) => !!currentFilter),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([options, currentFilter, visible]) => ({
				selected: !!currentFilter?.length
					? currentFilter.map((tribe) => '' + tribe)
					: options.map((tribe) => '' + tribe),
				placeholder: this.i18n.translateString('app.battlegrounds.filters.tribe.all-tribes'),
				visible: visible,
			})),
		);
	}

	onSelected(values: readonly string[]) {
		this.valueSelected.next((values ?? []).map((value) => +value as Race));
	}
}
