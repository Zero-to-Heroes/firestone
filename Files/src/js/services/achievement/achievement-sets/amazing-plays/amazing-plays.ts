import { AchievementConfService } from '../../achievement-conf.service';
import { GenericSetProvider } from '../generic-set-provider';

export class AmazingPlaysSetProvider extends GenericSetProvider {
	constructor(conf: AchievementConfService) {
		super(
			'amazing_plays',
			'Amazing Plays',
			['amazing_play_win_with_one_hp', 'amazing_play_win_with_full_hp'],
			'achievements_amazing_plays',
			conf,
		);
	}
}
