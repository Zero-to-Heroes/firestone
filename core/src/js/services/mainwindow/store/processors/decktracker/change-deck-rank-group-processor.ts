import { DeckFilters } from '../../../../../models/mainwindow/decktracker/deck-filters';
import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { ChangeDeckRankGroupEvent } from '../../events/decktracker/change-deck-rank-group-event';
import { Processor } from '../processor';

export class ChangeDeckRankGroupProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly replaysBuilder: ReplaysStateBuilderService,
	) {}

	public async process(
		event: ChangeDeckRankGroupEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const filters = Object.assign(new DeckFilters(), currentState.decktracker.filters, {
			rankingGroup: event.newRank,
		} as DeckFilters);
		await this.prefs.setDesktopDeckFilters(filters);
		const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
			filters: filters,
		} as DecktrackerState);
		return [
			currentState.update({
				decktracker: newState,
			} as MainWindowState),
			null,
		];
	}
}
