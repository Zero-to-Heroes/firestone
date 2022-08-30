import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { DecksStateBuilderService } from '../../../../decktracker/main/decks-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { ConstructedEjectDeckVersionEvent } from '../../events/decktracker/constructed-eject-deck-version-event';

export class ConstructedEjectDeckVersionProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly decksStateBuilder: DecksStateBuilderService,
	) {}

	public async process(
		event: ConstructedEjectDeckVersionEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.debug('[deck] ejecting version', event, currentState);
		const prefs = await this.prefs.getPreferences();
		const versionLinks = prefs.constructedDeckVersions;
		console.debug('[deck] existing versionLinks', versionLinks);
		const newVersionLinks = versionLinks.map((link) => ({
			...link,
			versions: link.versions.filter((version) => version.deckstring !== event.deckstringToEject),
		}));
		console.debug('[deck] newVersionLinks', newVersionLinks);

		const newPrefs = await this.prefs.savePreferences({ ...prefs, constructedDeckVersions: newVersionLinks });
		const newDecksState = this.decksStateBuilder.buildState(
			currentState.stats,
			currentState.decktracker.filters,
			currentState.decktracker.patch,
			newPrefs,
		);
		console.debug('[deck] newDecksState', newDecksState);
		return [
			currentState.update({
				decktracker: currentState.decktracker.update({
					decks: newDecksState,
				}),
			}),
			null,
		];
	}
}
