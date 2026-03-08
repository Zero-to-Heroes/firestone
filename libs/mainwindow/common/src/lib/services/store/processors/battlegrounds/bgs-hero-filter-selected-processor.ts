import { PreferencesService } from '@firestone/shared/common/service';
import {
	BgsHeroFilterSelectedEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class BgsHeroFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsHeroFilterSelectedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		await this.prefs.updateBgsHeroFilter(event.heroFilter);
		return [null, null];
	}
}
