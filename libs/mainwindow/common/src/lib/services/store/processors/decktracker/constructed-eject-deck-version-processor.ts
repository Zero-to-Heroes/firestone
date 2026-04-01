import { PreferencesService } from '@firestone/shared/common/service';
import { Processor } from '../processor';
import {
	ConstructedEjectDeckVersionEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';

export class ConstructedEjectDeckVersionProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ConstructedEjectDeckVersionEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const prefs = await this.prefs.getPreferences();
		const versionLinks = prefs.constructedDeckVersions;
		const newVersionLinks = versionLinks
			.map((link) => ({
				...link,
				versions: link.versions.filter((version) => version.deckstring !== event.deckstringToEject),
			}))
			.filter((link) => link.versions.length > 1);

		await this.prefs.savePreferences({ ...prefs, constructedDeckVersions: newVersionLinks });
		return [null, null];
	}
}
