import { AchievementConfService } from '../../achievement-conf.service';
import { AchievementCategoryProvider } from '../achievement-category-provider';
import { DalaranHeistBossSetProvider } from './dalaran-heist-boss';
import { DalaranHeistPassivesSetProvider } from './dalaran-heist-passves';
import { DalaranHeistTreasuresSetProvider } from './dalaran-heist-treasures';

export class DalaranHeistCategoryProvider extends AchievementCategoryProvider {
	constructor(conf: AchievementConfService) {
		super('dalaran_heist', 'Dalaran Heist', 'dalaran_heist', [
			new DalaranHeistTreasuresSetProvider(conf),
			new DalaranHeistPassivesSetProvider(conf),
			new DalaranHeistBossSetProvider(conf),
		]);
	}
}
