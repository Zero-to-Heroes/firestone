import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { DeckSortType, PatchesConfigService, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckSortEvent } from '@firestone/mainwindow/common';

@Component({
	standalone: false,
	selector: 'decktracker-deck-sort-dropdown',
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
export class DecktrackerDeckSortDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly nav: ConstructedNavigationService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.patchesConfig, this.nav);

		this.filter$ = combineLatest([
			this.patchesConfig.currentConstructedMetaPatch$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.desktopDeckFilters?.sort)),
			this.nav.currentView$$,
		]).pipe(
			filter(([patch, filter, currentView]) => !!filter && !!patch && !!currentView),
			this.mapData(([patch, filter, currentView]) => {
				const options = [
					{
						value: 'last-played',
						label: this.i18n.translateString('app.decktracker.filters.deck-sort.last-played'),
					} as DeckSortOption,
					{
						value: 'games-played',
						label: this.i18n.translateString('app.decktracker.filters.deck-sort.games-played'),
					} as DeckSortOption,
					{
						value: 'winrate',
						label: this.i18n.translateString('app.decktracker.filters.deck-sort.winrate'),
					} as DeckSortOption,
				];
				return {
					filter: filter,
					options: options,
					placeholder: options.find((option) => option.value === filter)?.label,
					visible: ![
						'deck-details',
						'ladder-stats',
						'ladder-ranking',
						'constructed-deckbuilder',
						'constructed-meta-decks',
						'constructed-meta-deck-details',
						'constructed-meta-archetypes',
						'constructed-meta-archetype-details',
					].includes(currentView),
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	onSelected(option: IOption) {
		this.mainWindowStateFacade.send(new ChangeDeckSortEvent((option as DeckSortOption).value));
	}
}

interface DeckSortOption extends IOption {
	value: DeckSortType;
}
