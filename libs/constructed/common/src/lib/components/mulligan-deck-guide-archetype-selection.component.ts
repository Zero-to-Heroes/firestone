/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { GameFormat } from '@firestone-hs/constructed-deck-stats';
import { decode } from '@firestone-hs/deckstrings';
import { GameFormatString } from '@firestone-hs/reference-data';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { MultiselectOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, groupByFunction, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter, from, switchMap, tap } from 'rxjs';
import { ConstructedMetaDecksStateService } from '../services/constructed-meta-decks-state-builder.service';
import { ConstructedNavigationService } from '../services/constructed-navigation.service';

@Component({
	selector: 'mulligan-deck-guide-archetype-selection',
	styleUrls: [`./mulligan-deck-guide-archetype-selection.component.scss`],
	template: `
		<filter-dropdown-combined
			*ngIf="filter$ | async as value"
			class="filter-dropdown"
			[options]="options$ | async"
			[selected]="value.selected"
			[placeholder]="value.placeholder"
			[visible]="true"
			[allowSearch]="true"
			[allowMultipleSelection]="false"
			(optionSelected)="onSelected($event)"
		></filter-dropdown-combined>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MulliganDeckGuideArchetypeSelectionDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options$: Observable<MultiselectOption[]>;
	filter$: Observable<{ selected: readonly string[]; placeholder: string }>;

	@Input() set deckstring(value: string | null) {
		this.deckstring$$.next(value);
	}
	@Input() set archetypeId(value: number | null) {
		this.archetypeId$$.next(value);
	}
	@Input() set format(value: GameFormatString | null) {
		this.format$$.next(value);
	}

	private deckstring$$ = new BehaviorSubject<string | null>(null);
	private archetypeId$$ = new BehaviorSubject<number | null>(null);
	private format$$ = new BehaviorSubject<GameFormatString | null>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
		private readonly constructedMetaStats: ConstructedMetaDecksStateService,
		private readonly nav: ConstructedNavigationService,
		private readonly allCards: CardsFacadeService,
	) // private readonly mulligan: ConstructedMulliganGuideService,
	{
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.constructedMetaStats, this.prefs, this.nav);

		const effectiveRank$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.decktrackerMulliganRankBracket),
		);

		this.options$ = combineLatest([this.deckstring$$, this.format$$, effectiveRank$]).pipe(
			tap(([deckstring, effectiveFormat, effectiveRank]) =>
				console.log('building archetype options', deckstring, effectiveFormat, effectiveRank),
			),
			filter(
				([deckstring, effectiveFormat, effectiveRank]) =>
					!!deckstring?.length && !!effectiveFormat?.length && !!effectiveRank?.length,
			),
			switchMap(([deckstring, effectiveFormat, effectiveRank]) =>
				combineLatest([
					from([deckstring]),
					this.constructedMetaStats.loadNewArchetypes(
						effectiveFormat! as GameFormat,
						'last-patch',
						effectiveRank,
					),
				]),
			),
			filter(([deckstring, archetypes]) => !!deckstring?.length && !!archetypes?.archetypeStats?.length),
			this.mapData(([deckstring, refArchetypes]) => {
				const deckDefinition = decode(deckstring!);
				const playerClasses = this.allCards
					.getCard(deckDefinition.heroes[0])
					.classes?.map((c) => c.toUpperCase());
				const archetypes = refArchetypes!.archetypeStats
					.filter((a) => !playerClasses?.length || playerClasses.includes(a.heroCardClass?.toUpperCase()))
					.flatMap((stat) => ({
						id: stat.id,
						name: stat.name,
						playerClass: stat.heroCardClass,
					}));
				const archetypesById = groupByFunction((a: { id: number; name: string; playerClass: string }) => a.id)(
					archetypes,
				);
				const options: MultiselectOption[] = Object.keys(archetypesById)
					.map((archetypeId) => {
						const archetype = archetypesById[archetypeId][0];
						const result = {
							value: '' + archetypeId,
							label:
								this.i18n.translateString(`archetype.${archetype.name}`) ===
								`archetype.${archetype.name}`
									? archetype.name
									: this.i18n.translateString(`archetype.${archetype.name}`),
							image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${archetype.playerClass}.png`,
							playerClass: archetype.playerClass,
						};
						return result;
					})
					.sort(sortByProperties((a) => [a.playerClass, a.label]));
				const blankOption: MultiselectOption = {
					value: '',
					label: 'No archetype',
					image: null,
					playerClass: null,
				} as MultiselectOption;
				return [blankOption, ...options];
			}),
		);
		this.filter$ = combineLatest([this.archetypeId$$, this.nav.currentView$$]).pipe(
			this.mapData(([archetypeId, currentView]) => ({
				selected: !!archetypeId ? [archetypeId + ''] : [],
				placeholder: 'No archetype found',
			})),
		) as any;

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: readonly string[]) {
		const prefs = await this.prefs.getPreferences();
		const newOverrides = {
			...prefs.constructedDeckArchetypeOverrides,
			[this.deckstring$$.value!]: option.length === 0 ? null : +option[0],
		};
		const newPrefs: Preferences = {
			...prefs,
			constructedDeckArchetypeOverrides: newOverrides,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
