import { AchievementConfService } from '../../achievement-conf.service';
import { AchievementCategoryProvider } from '../achievement-category-provider';
import { AmazingPlaysSetProvider } from './amazing-plays';

export class AmazingPlaysCategoryProvider extends AchievementCategoryProvider {
	constructor(conf: AchievementConfService) {
		super('amazing_plays', 'Amazing Plays', 'amazing_plays', [new AmazingPlaysSetProvider(conf)]);
	}
}
