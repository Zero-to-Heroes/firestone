/* eslint-disable @typescript-eslint/member-ordering */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { CardIds, duelsHeroConfigs, normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { MultiselectOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, arraysEqual, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
	selector: 'duels-main-filter-multiselect-dropdown-view',
	styleUrls: [],
	template: `
		<filter-dropdown-multiselect
			*ngIf="filter$ | async as value"
			class="duels-hero-filter-dropdown"
			[options]="options$ | async"
			[selected]="value.selected"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(optionSelected)="onSelected($event)"
		></filter-dropdown-multiselect>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsMainFilterMultiselectDropdownViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options$: Observable<MultiselectOption[]>;
	filter$: Observable<{ selected: readonly string[]; placeholder: string; visible: boolean }>;

	@Output() optionSelected = new EventEmitter<readonly string[]>();

	@Input() allValuesLabel = this.i18n.translateString('app.duels.filters.hero-power.all') as string;
	@Input() referenceCards = duelsHeroConfigs.flatMap((conf) => conf.heroPowers);
	@Input() extractor: (conf: typeof duelsHeroConfigs[0]) => readonly CardIds[] = (conf) => conf.heroPowers;

	@Input() set selectedHeroPowers(value: readonly string[] | null) {
		this.selectedHeroPowers$$.next(value ?? []);
	}
	@Input() set selectedHeroes(value: readonly string[] | null) {
		this.selectedHeroes$$.next(value ?? []);
	}
	@Input() set selectedSignatureTreasures(value: readonly string[] | null) {
		this.selectedSignatureTreasures$$.next(value ?? []);
	}
	@Input() set currentFilter(value: readonly string[] | null) {
		this.currentFilter$$.next(value ?? []);
	}
	@Input() set visible(value: boolean) {
		this.visible$$.next(value);
	}

	private selectedHeroPowers$$ = new BehaviorSubject<readonly string[]>([]);
	private selectedHeroes$$ = new BehaviorSubject<readonly string[]>([]);
	private selectedSignatureTreasures$$ = new BehaviorSubject<readonly string[]>([]);
	private currentFilter$$ = new BehaviorSubject<readonly string[]>([]);
	private visible$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		// Common to hero/hero power/signature
		const confsForHeroes$ = this.selectedHeroes$$.pipe(
			this.mapData((selectedHeroes) =>
				duelsHeroConfigs.filter((conf) => this.isConfForHero(conf, selectedHeroes)),
			),
		);
		const confsForHeroPowers$ = this.selectedHeroPowers$$.pipe(
			this.mapData((selectedHeroPowers) =>
				duelsHeroConfigs.filter((conf) => this.isConfForHeroPower(conf, selectedHeroPowers)),
			),
		);
		const confsForSignatureTreasures$ = this.selectedSignatureTreasures$$.pipe(
			this.mapData((selectedSignatures) =>
				duelsHeroConfigs.filter((conf) => this.isConfForSignatureTreasure(conf, selectedSignatures)),
			),
		);
		const refCards$ = combineLatest([confsForHeroes$, confsForHeroPowers$, confsForSignatureTreasures$]).pipe(
			this.mapData(([confsForHeroes, confsForHeroPowers, confsForSignatureTreasures]) => {
				return this.referenceCards
					.filter((cardId) =>
						confsForHeroes
							// From all these confs, check if the hero power is in one of them
							.flatMap((conf) => this.extractor(conf))
							.includes(cardId as CardIds),
					)
					.filter((cardId) =>
						confsForHeroPowers
							// From all these confs, check if the hero power is in one of them
							.flatMap((conf) => this.extractor(conf))
							.includes(cardId as CardIds),
					)
					.filter((cardId) =>
						confsForSignatureTreasures.flatMap((conf) => this.extractor(conf)).includes(cardId as CardIds),
					);
			}),
		);
		this.options$ = refCards$.pipe(
			this.mapData((cardIds) =>
				cardIds
					.map((cardId) => this.allCards.getCard(cardId))
					.sort(sortByProperties((c) => [c.name, c.playerClass]))
					.map((card) => {
						return {
							value: card.id,
							label: card.name,
							image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${card.id}.jpg`,
						} as MultiselectOption;
					}),
			),
		);
		this.filter$ = combineLatest([this.options$, this.currentFilter$$, this.visible$$]).pipe(
			filter(([options, currentFilter, visible]) => !!currentFilter && !!options?.length),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([options, currentFilter, visible]) => ({
				selected: currentFilter,
				placeholder: this.allValuesLabel,
				visible: visible,
			})),
		);
	}

	isConfForHero(conf: typeof duelsHeroConfigs[0], selectedHeroes: readonly string[]): boolean {
		if (!selectedHeroes.length) {
			return true;
		}

		return selectedHeroes.some((cardId) => normalizeDuelsHeroCardId(conf.hero) === cardId);
	}

	isConfForHeroPower(conf: typeof duelsHeroConfigs[0], selectedHeroPowers: readonly string[]): boolean {
		if (!selectedHeroPowers.length) {
			return true;
		}

		return selectedHeroPowers.some((cardId) => conf.heroPowers.includes(cardId as CardIds));
	}

	isConfForSignatureTreasure(
		conf: typeof duelsHeroConfigs[0],
		selectedSignatureTreasures: readonly string[],
	): boolean {
		if (!selectedSignatureTreasures.length) {
			return true;
		}

		return selectedSignatureTreasures.some((cardId) => conf.signatureTreasures.includes(cardId as CardIds));
	}

	onSelected(options: readonly string[]) {
		this.optionSelected.next(options);
	}
}
