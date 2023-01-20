import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { formatClass } from '../../../services/hs-utils';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { sortByProperties } from '../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';
import { MultiselectOption } from '../../filter-dropdown-multiselect.component';

@Component({
	selector: 'replays-deckstring-filter-dropdown',
	styleUrls: [
		`../../../../css/global/filters.scss`,
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown-multiselect
			*ngIf="filter$ | async as value"
			[options]="value.options"
			[selected]="value.selected"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown-multiselect>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysDeckstringFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	filter$: Observable<{
		selected: readonly string[];
		placeholder: string;
		visible: boolean;
		options: readonly MultiselectOption[];
	}>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.filter$ = combineLatest(
			this.store.decks$(),
			this.store.listen$(
				([main, nav]) => nav.currentApp,
				([main, nav]) => nav.navigationDecktracker.currentView,
				([main, nav, prefs]) => prefs.replaysActiveGameModeFilter,
				([main, nav, prefs]) => prefs.replaysActiveDeckstringsFilter,
				([main, nav, prefs]) => prefs.desktopDeckHiddenDeckCodes,
			),
		).pipe(
			this.mapData(([decks, [currentApp, currentView, gameModeFilter, deckstringFilter, archivedDecks]]) => {
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
							['ranked', 'ranked-standard', 'ranked-wild', 'ranked-classic'].includes(gameModeFilter)) ||
						(currentApp === 'decktracker' && currentView === 'ladder-stats'),
				};
			}),
		);
	}

	onSelected(selectedDeckstrings: readonly string[]) {
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs) => ({
				...prefs,
				replaysActiveDeckstringsFilter: selectedDeckstrings,
			})),
		);
	}
}
