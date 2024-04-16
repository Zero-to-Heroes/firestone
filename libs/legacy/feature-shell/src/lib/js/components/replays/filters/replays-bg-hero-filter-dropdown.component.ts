import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';

@Component({
	selector: 'replays-bg-hero-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysBgHeroFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	options: IOption[];
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
		const collator = new Intl.Collator('en-US');
		this.options = [
			{
				value: null,
				label: this.i18n.translateString('app.replays.filters.hero.all'),
			} as IOption,
			...this.allCards
				.getCards()
				.filter((card) => card.battlegroundsHero)
				.map(
					(card) =>
						({
							label: card.name,
							value: card.id,
						} as IOption),
				)
				.sort((a, b) => collator.compare(a.label, b.label)),
		];
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.filter$ = this.prefs.preferences$$.pipe(
			this.mapData(
				(prefs) => ({
					filter: prefs.replaysActiveBgHeroFilter,
					gameModeFilter: prefs.replaysActiveGameModeFilter,
				}),
				(a, b) => deepEqual(a, b),
			),
			this.mapData(({ filter, gameModeFilter }) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: ['battlegrounds', 'battlegrounds-duo'].includes(gameModeFilter),
			})),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			replaysActiveBgHeroFilter: option.value,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
