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
		const versionLinks: readonly ConstructedDeckVersions[] = prefs.constructedDeckVersions;
		console.log('processing new deck version', event, versionLinks);
		const existingLinkFromPreviousVersion: ConstructedDeckVersions = this.findExistingVersion(
			versionLinks,
			event.previousVersionDeckstring,
		);
		const existingLinkFromNewVersion: ConstructedDeckVersions = this.findExistingVersion(
			versionLinks,
			event.newVersionDeckstring,
		);
		console.log('existingLinkFromPreviousVersion', existingLinkFromPreviousVersion);
		console.log('existingLinkFromNewVersion', existingLinkFromNewVersion);
		const newLink: ConstructedDeckVersions = {
			versions: [
				...new Set([
					...(existingLinkFromPreviousVersion?.versions ?? []),
					...(existingLinkFromNewVersion?.versions ?? []),
				]),
			],
		};
		console.log('newLink', newLink);
		const newVersionLinks: readonly ConstructedDeckVersions[] = [...(versionLinks ?? []), newLink]
			.filter((link) => link !== existingLinkFromPreviousVersion && link !== existingLinkFromNewVersion)
			.filter((link) => link?.versions?.length > 0);

		await this.prefs.savePreferences({ ...prefs, constructedDeckVersions: newVersionLinks });
		return [null, null];
	}

	private findExistingVersion(
		versionLinks: readonly ConstructedDeckVersions[],
		previousVersionDeckstring: string,
	): ConstructedDeckVersions {
		return versionLinks.find((link) => link.versions.map((v) => v.deckstring).includes(previousVersionDeckstring));
	}
}
