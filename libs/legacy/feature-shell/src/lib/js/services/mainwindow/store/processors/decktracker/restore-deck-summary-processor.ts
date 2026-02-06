import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { ConstructedDeckVersions, PreferencesService } from '@firestone/shared/common/service';
import { RestoreDeckSummaryEvent } from '../../events/decktracker/restore-deck-summary-event';
import { Processor } from '../processor';

export class RestoreDeckSummaryProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: RestoreDeckSummaryEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		console.log(
			'[restore-deck-summary-processor] removing deck from hidden decks',
			event.deckstring,
			currentPrefs.desktopDeckHiddenDeckCodes,
		);
		const versionLinks: readonly ConstructedDeckVersions[] = currentPrefs.constructedDeckVersions;
		const linkedDecks = versionLinks.filter((link) =>
			link.versions.map((v) => v.deckstring).includes(event.deckstring),
		);
		const allDecksToRestore = [
			...(linkedDecks?.flatMap((link) => link.versions.map((v) => v.deckstring)) ?? []),
			event.deckstring,
		];
		const newHiddenDecks = (currentPrefs.desktopDeckHiddenDeckCodes ?? []).filter(
			(deckCode) => !allDecksToRestore?.includes(deckCode),
		);
		console.log('[restore-deck-summary-processor] new hidden decks', newHiddenDecks);
		await this.prefs.setDesktopDeckHiddenDeckCodes(newHiddenDecks);
		return [null, null];
	}
}
