import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedDeckVersions } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { ConstructedNewDeckVersionEvent } from '../../events/decktracker/constructed-new-deck-version-event';

export class ConstructedNewDeckVersionProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ConstructedNewDeckVersionEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const versionLinks = prefs.constructedDeckVersions;
		console.debug('processing new deck version', event, versionLinks);
		const existingLinkFromPreviousVersion = this.findExistingVersion(versionLinks, event.previousVersionDeckstring);
		const existingLinkFromNewVersion = this.findExistingVersion(versionLinks, event.newVersionDeckstring);
		console.debug('existingLinkFromPreviousVersion', existingLinkFromPreviousVersion);
		console.debug('existingLinkFromNewVersion', existingLinkFromNewVersion);
		const newLinkFromPreviousVersion = this.addVersion(existingLinkFromPreviousVersion, event.newVersionDeckstring);
		const newLinkFromNewVersion = this.addVersion(existingLinkFromNewVersion, event.previousVersionDeckstring);
		console.debug('newLinkFromPreviousVersion', newLinkFromPreviousVersion);
		console.debug('newLinkFromNewVersion', newLinkFromNewVersion);
		const link: ConstructedDeckVersions = newLinkFromPreviousVersion ??
			newLinkFromNewVersion ?? {
				versions: [{ deckstring: event.previousVersionDeckstring }, { deckstring: event.newVersionDeckstring }],
			};
		console.debug('new link', link);
		const cleanedLink: ConstructedDeckVersions = {
			versions: [...new Set(link.versions)],
		};
		const newVersionLinks = [
			...versionLinks.filter(
				(link) => !link.versions.map((v) => v.deckstring).includes(event.previousVersionDeckstring),
			),
			cleanedLink,
		];
		console.debug('newVersionLinks', newVersionLinks);

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
