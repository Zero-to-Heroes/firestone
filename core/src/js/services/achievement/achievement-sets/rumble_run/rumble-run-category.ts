import { AchievementCategoryProvider } from '../achievement-category-provider';
import { RumbleRunPassivesSetProvider } from './rumble-run-passves';
import { RumbleRunProgressionSetProvider } from './rumble-run-progression';
import { RumbleRunShrinesSetProvider } from './rumble-run-shrine-play';
import { RumbleRunTeammatesSetProvider } from './rumble-run-teammates';

export class RumbleRunCategoryProvider extends AchievementCategoryProvider {
	constructor() {
		super('rumble_run', 'Rumble Run', 'rumble_run', [
			new RumbleRunProgressionSetProvider(),
			new RumbleRunShrinesSetProvider(),
			new RumbleRunTeammatesSetProvider(),
			new RumbleRunPassivesSetProvider(),
		]);
	}
}
