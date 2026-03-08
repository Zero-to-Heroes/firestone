import { PreferencesService } from '@firestone/shared/common/service';
import {
	BgsHeroSortFilterSelectedEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class BgsHeroSortFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsHeroSortFilterSelectedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		await this.prefs.updateBgsHeroSortFilter(event.heroSortFilter);
		return [null, null];
	}
}
