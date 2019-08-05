import { AllCardsService } from '../../all-cards.service';
import { AbstractBossSetProvider } from './boss-abstract';
import { AchievementConfService } from '../achievement-conf.service';

export class MonsterHuntBossSetProvider extends AbstractBossSetProvider {
	constructor(cardsService: AllCardsService, conf: AchievementConfService) {
		super(
			'monster_hunt_boss',
			'achievements_boss',
			'Bosses',
			['monster_hunt_boss_encounter', 'monster_hunt_boss_victory'],
			cardsService,
			conf,
		);
	}
}
