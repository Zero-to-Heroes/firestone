import { ConstructedDeckVersions, PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { HideDeckSummaryEvent } from '../../events/decktracker/hide-deck-summary-event';
import { Processor } from '../processor';

export class HideDeckSummaryProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: HideDeckSummaryEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const versionLinks: readonly ConstructedDeckVersions[] = currentPrefs.constructedDeckVersions;
		const linkedDecks = versionLinks.filter((link) =>
			link.versions.map((v) => v.deckstring).includes(event.deckstring),
		);
		const allDecksToHide = [
			...(linkedDecks?.flatMap((link) => link.versions.map((v) => v.deckstring)) ?? []),
			event.deckstring,
		];
		const newHiddenDecks = [...currentPrefs.desktopDeckHiddenDeckCodes, ...allDecksToHide];
		await this.prefs.setDesktopDeckHiddenDeckCodes(newHiddenDecks);
		return [null, null];
	}
}
