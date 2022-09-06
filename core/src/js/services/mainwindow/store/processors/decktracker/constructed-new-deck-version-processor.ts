import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedDeckVersions } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { DecksStateBuilderService } from '../../../../decktracker/main/decks-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { ConstructedNewDeckVersionEvent } from '../../events/decktracker/constructed-new-deck-version-event';

export class ConstructedNewDeckVersionProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly decksStateBuilder: DecksStateBuilderService,
	) {}

	public async process(
		event: ConstructedNewDeckVersionEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.debug('[deck] processing new version', event, currentState);
		const prefs = await this.prefs.getPreferences();
		const versionLinks = prefs.constructedDeckVersions;
		console.debug('[deck] existing versionLinks', versionLinks);
		const link: ConstructedDeckVersions = this.addVersion(
			this.findExistingVersion(versionLinks, event.previousVersionDeckstring),
			event.newVersionDeckstring,
		) ??
			this.addVersion(
				this.findExistingVersion(versionLinks, event.newVersionDeckstring),
				event.previousVersionDeckstring,
			) ?? {
				versions: [{ deckstring: event.previousVersionDeckstring }, { deckstring: event.newVersionDeckstring }],
			};
		console.debug('[deck] newLink', link);
		const newVersionLinks = [
			...versionLinks.filter(
				(link) => !link.versions.map((v) => v.deckstring).includes(event.previousVersionDeckstring),
			),
			link,
		];
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

	private findExistingVersion(
		versionLinks: readonly ConstructedDeckVersions[],
		previousVersionDeckstring: string,
	): ConstructedDeckVersions {
		return versionLinks.find((link) => link.versions.map((v) => v.deckstring).includes(previousVersionDeckstring));
	}

	private addVersion(existing: ConstructedDeckVersions, newVersion: string): ConstructedDeckVersions {
		if (!existing) {
			return null;
		}
		console.debug('[deck] addVersion', existing, newVersion);
		return {
			...existing,
			versions: [...existing.versions, { deckstring: newVersion }],
		};
	}
}
