import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { MultiselectOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
	selector: 'battlegrounds-anomalies-filter-dropdown-view',
	styleUrls: [],
	template: `
		<filter-dropdown-multiselect
			*ngIf="filter$ | async as value"
			class="battlegrounds-anomalies-filter-dropdown"
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
export class BattlegroundsAnomaliesFilterDropdownViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options$: Observable<readonly MultiselectOption[]>;
	filter$: Observable<{ selected: readonly string[]; placeholder: string; visible: boolean }>;

	@Output() valueSelected = new EventEmitter<readonly string[]>();

	@Input() set allAnomalies(value: readonly string[]) {
		this.allAnomalies$$.next(value);
	}
	@Input() set currentFilter(value: readonly string[]) {
		this.currentFilter$$.next(value);
	}
	@Input() set visible(value: boolean) {
		this.visible$$.next(value);
	}

	@Input() validationErrorTooltip = this.i18n.translateString(
		'app.battlegrounds.filters.anomaly.validation-error-tooltip',
	);

	private allAnomalies$$ = new BehaviorSubject<readonly string[]>([]);
	private currentFilter$$ = new BehaviorSubject<readonly string[]>([]);
	private visible$$ = new BehaviorSubject<boolean>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.options$ = this.allAnomalies$$.pipe(
			filter((all) => !!all?.length),
			this.mapData((allAnomalies) => {
				const result = allAnomalies
					.map(
						(anomaly) =>
							({
								value: '' + anomaly,
								label: this.allCards.getCard(anomaly).name,
								image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${anomaly}.jpg`,
							} as MultiselectOption),
					)
					.sort((a, b) => (a.label < b.label ? -1 : 1));
				console.debug('anomaly options', result);
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
				placeholder: this.i18n.translateString('app.battlegrounds.filters.anomaly.all-anomalies'),
				visible: visible,
			})),
		);
	}

	onSelected(values: readonly string[]) {
		this.valueSelected.next(values ?? []);
	}
}
