import { AchievementConfService } from '../achievement-conf.service';
import { AbstractBossSetProvider } from './boss-abstract';

export class MonsterHuntBossSetProvider extends AbstractBossSetProvider {
	constructor(conf: AchievementConfService) {
		super('monster_hunt_boss', 'achievements_boss', 'Bosses', ['monster_hunt_boss_encounter', 'monster_hunt_boss_victory'], conf);
	}
}
