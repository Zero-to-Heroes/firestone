import { ConstructedDeckVersions, PreferencesService } from '@firestone/shared/common/service';
import {
	HideDeckSummaryEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class HideDeckSummaryProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: HideDeckSummaryEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
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
