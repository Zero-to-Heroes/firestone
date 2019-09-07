import { AchievementConfService } from '../../achievement-conf.service';
import { AchievementCategoryProvider } from '../achievement-category-provider';
import { RumbleRunPassivesSetProvider } from './rumble-run-passves';
import { RumbleRunProgressionSetProvider } from './rumble-run-progression';
import { RumbleRunShrinesSetProvider } from './rumble-run-shrine-play';
import { RumbleRunTeammatesSetProvider } from './rumble-run-teammates';

export class RumbleRunCategoryProvider extends AchievementCategoryProvider {
	constructor(conf: AchievementConfService) {
		super('rumble_run', 'Rumble Run', 'rumble_run', [
			new RumbleRunProgressionSetProvider(conf),
			new RumbleRunShrinesSetProvider(conf),
			new RumbleRunTeammatesSetProvider(conf),
			new RumbleRunPassivesSetProvider(conf),
		]);
	}
}
