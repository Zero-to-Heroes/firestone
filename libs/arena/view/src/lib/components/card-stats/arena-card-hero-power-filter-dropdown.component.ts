import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Optional,
	ViewRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ALL_CLASSES, CardClass, getDefaultHeroPower } from '@firestone-hs/reference-data';
import { ArenaCardHeroPowerFilterType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { BaseFilterWithUrlComponent, FilterUrlConfig } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'arena-card-hero-power-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			[options]="value.options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardHeroPowerFilterDropdownComponent
	extends BaseFilterWithUrlComponent<ArenaCardHeroPowerFilterType, Preferences>
	implements AfterContentInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	protected filterConfig: FilterUrlConfig<ArenaCardHeroPowerFilterType, Preferences> = {
		paramName: 'arenaActiveCardHeroPowerFilter',
		preferencePath: 'arenaActiveCardHeroPowerFilter',
		validValues: ['all', ...ALL_CLASSES.map((c) => getDefaultHeroPower(CardClass[c.toUpperCase()]))],
	};

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Optional() protected override readonly route: ActivatedRoute,
		@Optional() protected override readonly router: Router,
		protected override readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr, prefs, route, router, new Preferences());
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();

		// Initialize URL synchronization
		this.initializeUrlSync();

		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaActiveCardHeroPowerFilter)),
		]).pipe(
			filter(([filter]) => !!filter),
			this.mapData(([filter]) => {
				const options = this.filterConfig.validValues!.map((option) => ({
					value: option,
					label:
						option === 'all'
							? this.i18n.translateString('app.duels.filters.hero-power.all')
							: (this.allCards.getCard(option)?.name ?? option),
					image:
						option === 'all'
							? null
							: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${option}.jpg`,
				}));
				return {
					filter: filter,
					options: options,
					placeholder:
						options.find((option) => option.value === filter)?.label ??
						this.i18n.translateString('app.duels.filters.hero-power.all'),
					visible: true,
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	async onSelected(option: IOption) {
		await this.prefs.updatePrefs('arenaActiveCardHeroPowerFilter', option.value as ArenaCardHeroPowerFilterType);
	}
}
