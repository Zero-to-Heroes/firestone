import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedEjectDeckVersionEvent } from '../../events/decktracker/constructed-eject-deck-version-event';

export class ConstructedEjectDeckVersionProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ConstructedEjectDeckVersionEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const versionLinks = prefs.constructedDeckVersions;
		const newVersionLinks = versionLinks.map((link) => ({
			...link,
			versions: link.versions.filter((version) => version.deckstring !== event.deckstringToEject),
		}));

		await this.prefs.savePreferences({ ...prefs, constructedDeckVersions: newVersionLinks });
		return [null, null];
	}
}
