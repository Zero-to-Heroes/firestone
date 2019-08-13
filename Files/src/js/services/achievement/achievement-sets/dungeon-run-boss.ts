import { AchievementConfService } from '../achievement-conf.service';
import { AbstractBossSetProvider } from './boss-abstract';

export class DungeonRunBossSetProvider extends AbstractBossSetProvider {
	constructor(conf: AchievementConfService) {
		super('dungeon_run_boss', 'achievements_boss', 'Bosses', ['dungeon_run_boss_encounter', 'dungeon_run_boss_victory'], conf);
	}
}
