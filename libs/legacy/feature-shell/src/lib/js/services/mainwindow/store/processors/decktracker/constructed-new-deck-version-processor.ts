import { ConstructedDeckVersions, MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedNewDeckVersionEvent } from '@firestone/mainwindow/common';

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
		const newLinkVersions: readonly string[] = [
			...new Set([
				...(existingLinkFromPreviousVersion?.versions?.flatMap((v) => v.deckstring) ?? []),
				event.previousVersionDeckstring,
				...(existingLinkFromNewVersion?.versions?.flatMap((v) => v.deckstring) ?? []),
				event.newVersionDeckstring,
			]),
		];
		const newLink: ConstructedDeckVersions = {
			versions: newLinkVersions.map((deckstring) => ({ deckstring })),
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
