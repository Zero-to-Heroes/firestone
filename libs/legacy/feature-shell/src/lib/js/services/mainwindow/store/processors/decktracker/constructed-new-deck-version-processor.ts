import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedDeckVersions } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { PreferencesService } from '../../../../preferences.service';
import { ConstructedNewDeckVersionEvent } from '../../events/decktracker/constructed-new-deck-version-event';

export class ConstructedNewDeckVersionProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ConstructedNewDeckVersionEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const versionLinks = prefs.constructedDeckVersions;
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
		const newVersionLinks = [
			...versionLinks.filter(
				(link) => !link.versions.map((v) => v.deckstring).includes(event.previousVersionDeckstring),
			),
			link,
		];

		await this.prefs.savePreferences({ ...prefs, constructedDeckVersions: newVersionLinks });
		return [null, null];
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
		return {
			...existing,
			versions: [...existing.versions, { deckstring: newVersion }],
		};
	}
}
