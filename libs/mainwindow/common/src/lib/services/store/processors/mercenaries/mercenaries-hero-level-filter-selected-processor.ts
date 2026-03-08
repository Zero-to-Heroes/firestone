import { PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowState,
	MercenariesHeroLevelFilterSelectedEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class MercenariesHeroLevelFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesHeroLevelFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		await this.prefs.updateMercenariesHeroLevelFilter(event.level);
		return [null, null];
	}
}
