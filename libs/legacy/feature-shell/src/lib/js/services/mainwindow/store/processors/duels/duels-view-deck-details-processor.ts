import { DuelsDeckStat } from '@legacy-import/src/lib/js/models/duels/duels-player-stats';
import { LocalizationService } from '@services/localization.service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDuels } from '../../../../../models/mainwindow/navigation/navigation-duels';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsTopDeckService } from '../../../../duels/duels-top-decks.service';
import { Events } from '../../../../events.service';
import { formatClass } from '../../../../hs-utils';
import { DuelsViewDeckDetailsEvent } from '../../events/duels/duels-view-deck-details-event';
import { Processor } from '../processor';

export class DuelsViewDeckDetailsProcessor implements Processor {
	constructor(
		private readonly events: Events,
		private readonly i18n: LocalizationService,
		private readonly topDecks: DuelsTopDeckService,
	) {}

	public async process(
		event: DuelsViewDeckDetailsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const topDecks = this.topDecks.replaySubject.getValue();
		const deck = topDecks
			?.map((grouped) => grouped.decks)
			.reduce((a, b) => a.concat(b), [])
			.find((deck) => deck.id === event.deckId);
		if (!currentState.duels.additionalDeckDetails.map((stat) => stat.runId).includes(deck?.runId)) {
			this.events.broadcast(Events.DUELS_LOAD_TOP_DECK_RUN_DETAILS, deck?.runId, event.deckId);
		}
		return [
			null,
			navigationState.update({
				navigationDuels: navigationState.navigationDuels.update({
					selectedCategoryId: 'duels-deck-details',
					selectedDeckId: event.deckId,
					selectedPersonalDeckstring: undefined,
					menuDisplayType: 'breadcrumbs',
					expandedRunIds: [deck?.runId] as readonly string[],
					treasureSearchString: null,
					heroSearchString: null,
				} as NavigationDuels),
				text: this.getDeckName(deck),
			} as NavigationState),
		];
	}

	private getDeckName(deck: DuelsDeckStat): string {
		if (!deck) {
			return null;
		}
		const prefix = deck.wins ? `${deck.wins}-${deck.losses} ` : '';
		return prefix + formatClass(deck.playerClass, this.i18n);
	}
}
