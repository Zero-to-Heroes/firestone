import { AchievementConfService } from '../../achievement-conf.service';
import { GenericSetProvider } from '../generic-set-provider';

export class DalaranHeistTreasuresSetProvider extends GenericSetProvider {
	constructor(conf: AchievementConfService) {
		super(
			'dalaran_heist_treasure',
			'Treasures',
			[
				'dalaran_heist_treasure_play_DALA_700',
				'dalaran_heist_treasure_play_DALA_701',
				'dalaran_heist_treasure_play_DALA_702',
				'dalaran_heist_treasure_play_DALA_703',
				'dalaran_heist_treasure_play_DALA_704',
				'dalaran_heist_treasure_play_DALA_705',
				'dalaran_heist_treasure_play_DALA_706',
				'dalaran_heist_treasure_play_DALA_707',
				'dalaran_heist_treasure_play_DALA_708',
				'dalaran_heist_treasure_play_DALA_709',
				'dalaran_heist_treasure_play_DALA_711',
				'dalaran_heist_treasure_play_DALA_712',
				'dalaran_heist_treasure_play_DALA_713',
				'dalaran_heist_treasure_play_DALA_714',
				'dalaran_heist_treasure_play_DALA_715',
				'dalaran_heist_treasure_play_DALA_716',
				'dalaran_heist_treasure_play_DALA_717',
				'dalaran_heist_treasure_play_DALA_718',
				'dalaran_heist_treasure_play_DALA_719',
				'dalaran_heist_treasure_play_DALA_720',
				'dalaran_heist_treasure_play_DALA_721',
				'dalaran_heist_treasure_play_DALA_722',
				'dalaran_heist_treasure_play_DALA_723',
				'dalaran_heist_treasure_play_DALA_724',
				'dalaran_heist_treasure_play_DALA_725',
				'dalaran_heist_treasure_play_DALA_726',
				'dalaran_heist_treasure_play_DALA_727',
				'dalaran_heist_treasure_play_DALA_729',
				'dalaran_heist_treasure_play_DALA_730',
			],
			'achievements_treasure',
			conf,
		);
	}
}
