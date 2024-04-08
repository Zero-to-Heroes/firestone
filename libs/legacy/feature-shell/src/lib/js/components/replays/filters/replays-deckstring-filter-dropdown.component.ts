import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ConstructedNavigationService, DeckSummary } from '@firestone/constructed/common';
import { MultiselectOption } from '@firestone/shared/common/view';
import { waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable, combineLatest } from 'rxjs';
import { formatClass } from '../../../services/hs-utils';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { sortByProperties } from '../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

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
			(optionSelected)="onSelected($event)"
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
		private readonly nav: ConstructedNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.filter$ = combineLatest(
			this.store.decks$(),
			this.nav.currentView$$,
			this.store.listen$(
				([main, nav]) => nav.currentApp,
				([main, nav, prefs]) => prefs.replaysActiveGameModeFilter,
				([main, nav, prefs]) => prefs.replaysActiveDeckstringsFilter,
				([main, nav, prefs]) => prefs.desktopDeckHiddenDeckCodes,
			),
		).pipe(
			this.mapData(([decks, currentView, [currentApp, gameModeFilter, deckstringFilter, archivedDecks]]) => {
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

	onSelected(selectedDeckstrings: readonly string[]) {
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs) => ({
				...prefs,
				replaysActiveDeckstringsFilter: selectedDeckstrings,
			})),
		);
	}
}
