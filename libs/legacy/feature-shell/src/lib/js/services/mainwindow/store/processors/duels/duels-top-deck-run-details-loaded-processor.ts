import { DuelsDeckStat } from '../../../../../models/duels/duels-player-stats';
import { DuelsState } from '../../../../../models/duels/duels-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsTopDeckRunDetailsLoadedEvent } from '../../events/duels/duels-top-deck-run-details-loaded-event';
import { Processor } from '../processor';

export class DuelsTopDeckRunDetailsLoadedProcessor implements Processor {
	public async process(
		event: DuelsTopDeckRunDetailsLoadedEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		if (!event.deck) {
			return [null, null];
		}

		const newDeckDetails: readonly DuelsDeckStat[] = [
			...(currentState.duels.additionalDeckDetails || []),
			event.deck,
		];
		return [
			currentState.update({
				duels: currentState.duels.update({
					additionalDeckDetails: newDeckDetails,
				} as DuelsState),
			} as MainWindowState),
			null,
		];
	}
}
