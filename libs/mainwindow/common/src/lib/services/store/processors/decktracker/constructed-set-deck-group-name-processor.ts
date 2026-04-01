import { ConstructedDeckVersions, PreferencesService } from '@firestone/shared/common/service';
import { ConstructedSetDeckGroupNameEvent, MainWindowState, NavigationState } from '../../store-internal';
import { Processor } from '../processor';

export class ConstructedSetDeckGroupNameProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ConstructedSetDeckGroupNameEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const prefs = await this.prefs.getPreferences();
		const versionLinks: readonly ConstructedDeckVersions[] = prefs.constructedDeckVersions ?? [];
		const trimmed = event.groupName?.trim() ?? '';
		const newVersionLinks = versionLinks.map((link) => {
			const inGroup = link.versions.some((v) => v.deckstring === event.deckstringInGroup);
			if (!inGroup) {
				return link;
			}
			if (trimmed) {
				return { ...link, groupName: trimmed };
			}
			return { versions: link.versions } as ConstructedDeckVersions;
		});

		await this.prefs.savePreferences({ ...prefs, constructedDeckVersions: newVersionLinks });
		return [null, null];
	}
}
