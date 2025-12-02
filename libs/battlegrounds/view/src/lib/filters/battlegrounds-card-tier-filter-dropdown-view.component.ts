import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { BgsCardTierFilterType } from '@firestone/shared/common/service';
import { MultiselectOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'battlegrounds-card-tier-filter-dropdown-view',
	styleUrls: [],
	template: `
		<filter-dropdown-multiselect
			*ngIf="filter$ | async as value"
			class="battlegrounds-card-tier-filter-dropdown"
			[options]="options"
			[selected]="value.selected"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(optionSelected)="onSelected($event)"
		></filter-dropdown-multiselect>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCardTierFilterDropdownViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: readonly MultiselectOption[];
	filter$: Observable<{ selected: readonly string[]; placeholder: string; visible: boolean }>;

	@Output() valueSelected = new EventEmitter<readonly BgsCardTierFilterType[]>();

	@Input() set currentFilter(value: readonly BgsCardTierFilterType[] | null) {
		this.currentFilter$$.next(value);
	}
	@Input() set visible(value: boolean) {
		this.visible$$.next(value);
	}

	private currentFilter$$ = new BehaviorSubject<readonly BgsCardTierFilterType[] | null>(null);
	private visible$$ = new BehaviorSubject<boolean>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.options = [1, 2, 3, 4, 5, 6, 7].map((tier) => ({
			value: '' + tier,
			label: this.i18n.translateString('app.battlegrounds.filters.tier.tier', { value: tier }),
			image: `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/tavern_banner_${tier}.png`,
		}));

		this.filter$ = combineLatest([this.currentFilter$$, this.visible$$]).pipe(
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([currentFilter, visible]) => ({
				selected: !!currentFilter?.length
					? currentFilter.map((tier) => '' + tier)
					: this.options.map((tier) => '' + tier),
				placeholder: this.i18n.translateString('app.battlegrounds.filters.tier.all-tiers'),
				visible: visible,
			})),
		);
	}

	onSelected(values: readonly string[]) {
		this.valueSelected.next((values ?? []).map((value) => parseInt(value) as BgsCardTierFilterType));
	}
}
