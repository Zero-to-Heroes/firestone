import { AchievementConfService } from '../../achievement-conf.service';
import { GenericSetProvider } from '../generic-set-provider';

export class MonsterHuntProgressionSetProvider extends GenericSetProvider {
	constructor(conf: AchievementConfService) {
		super(
			'monster_hunt_progression',
			'Progression',
			[
				'monster_hunt_progression_GILA_400h',
				'monster_hunt_progression_GILA_500h3',
				'monster_hunt_progression_GILA_600h',
				'monster_hunt_progression_GILA_900h',
				'monster_hunt_final_boss',
			],
			'achievements_progression',
			conf,
		);
	}
}
