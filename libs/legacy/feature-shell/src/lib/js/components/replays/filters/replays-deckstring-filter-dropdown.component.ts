import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ConstructedNavigationService, DeckSummary } from '@firestone/constructed/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { MultiselectOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable, combineLatest, distinctUntilChanged } from 'rxjs';
import { DecksProviderService } from '../../../services/decktracker/main/decks-provider.service';
import { formatClass } from '../../../services/hs-utils';
import { sortByProperties } from '../../../services/utils';

@Component({
	selector: 'replays-deckstring-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown-multiselect
			*ngIf="filter$ | async as value"
			[options]="value.options"
			[selected]="value.selected"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			[resetIsClear]="true"
			(optionSelected)="onSelected($event)"
		></filter-dropdown-multiselect>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysDeckstringFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	filter$: Observable<{
		selected: readonly string[];
		placeholder: string;
		visible: boolean;
		options: readonly MultiselectOption[];
	}>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly nav: ConstructedNavigationService,
		private readonly mainNav: MainWindowNavigationService,
		private readonly decks: DecksProviderService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.mainNav, this.decks, this.prefs);

		this.filter$ = combineLatest([
			this.decks.decks$$,
			this.nav.currentView$$,
			this.mainNav.currentApp$$,
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					gameModeFilter: prefs.replaysActiveGameModeFilter,
					deckstringFilter: prefs.replaysActiveDeckstringsFilter,
					archivedDecks: prefs.desktopDeckHiddenDeckCodes,
				})),
				distinctUntilChanged(
					(a, b) =>
						a.gameModeFilter === b.gameModeFilter &&
						arraysEqual(a.deckstringFilter, b.deckstringFilter) &&
						arraysEqual(a.archivedDecks, b.archivedDecks),
				),
			),
		]).pipe(
			this.mapData(([decks, currentView, currentApp, { gameModeFilter, deckstringFilter, archivedDecks }]) => {
				const options: readonly MultiselectOption[] = (
					decks?.filter((deck) => deck.totalGames > 0 || deck.isPersonalDeck) ?? []
				)
					.filter((deck) => !archivedDecks.includes(deck.deckstring))
					.sort(sortByProperties((deck: DeckSummary) => [-deck.lastUsedTimestamp]))
					.map(
						(deck) =>
							({
								label: deck.deckName,
								value: deck.deckstring,
								image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${deck.skin}.jpg`,
								tooltip: this.i18n.translateString('app.replays.filters.deck.deckstring-tooltip', {
									deckName: deck.deckName,
									deckClass: formatClass(deck.class, this.i18n),
									lastPlayedDate: new Date(deck.lastUsedTimestamp).toLocaleDateString(
										this.i18n.formatCurrentLocale(),
										{
											month: 'short',
											day: '2-digit',
											year: 'numeric',
										},
									),
								}),
							} as MultiselectOption),
					);
				return {
					options: options,
					selected: deckstringFilter,
					placeholder: this.i18n.translateString('app.replays.filters.deck.all'),
					visible:
						(currentApp === 'replays' &&
							['ranked', 'ranked-standard', 'ranked-wild', 'ranked-classic', 'ranked-twist'].includes(
								gameModeFilter,
							)) ||
						(currentApp === 'decktracker' && currentView === 'ladder-stats'),
				};
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(selectedDeckstrings: readonly string[]) {
		const prefs: Preferences = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			replaysActiveDeckstringsFilter: selectedDeckstrings,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
