import { PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowState,
	MercenariesPveDifficultyFilterSelectedEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class MercenariesPveDifficultyFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesPveDifficultyFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		await this.prefs.updateMercenariesPveDifficultyFilter(event.difficulty);
		return [null, null];
	}
}
