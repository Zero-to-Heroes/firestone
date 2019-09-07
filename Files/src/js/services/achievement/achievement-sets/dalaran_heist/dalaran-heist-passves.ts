import { AchievementConfService } from '../../achievement-conf.service';
import { GenericSetProvider } from '../generic-set-provider';

export class DalaranHeistPassivesSetProvider extends GenericSetProvider {
	constructor(conf: AchievementConfService) {
		super(
			'dalaran_heist_passive',
			'Passives',
			[
				'dalaran_heist_passive_play_DALA_728',
				'dalaran_heist_passive_play_DALA_731',
				'dalaran_heist_passive_play_DALA_733',
				'dalaran_heist_passive_play_DALA_735',
				'dalaran_heist_passive_play_DALA_736',
				'dalaran_heist_passive_play_DALA_737',
				'dalaran_heist_passive_play_DALA_738',
				'dalaran_heist_passive_play_DALA_739',
				'dalaran_heist_passive_play_DALA_740',
				'dalaran_heist_passive_play_DALA_741',
				'dalaran_heist_passive_play_DALA_743',
				'dalaran_heist_passive_play_DALA_744',
				'dalaran_heist_passive_play_DALA_745',
				'dalaran_heist_passive_play_DALA_746',
				'dalaran_heist_passive_play_DALA_747',
				'dalaran_heist_passive_play_DALA_748',
				'dalaran_heist_passive_play_GILA_506',
				'dalaran_heist_passive_play_GILA_813',
				'dalaran_heist_passive_play_LOOTA_800',
				'dalaran_heist_passive_play_LOOTA_801',
				'dalaran_heist_passive_play_LOOTA_803',
				'dalaran_heist_passive_play_LOOTA_804',
				'dalaran_heist_passive_play_LOOTA_825',
				'dalaran_heist_passive_play_LOOTA_828',
				'dalaran_heist_passive_play_LOOTA_831',
				'dalaran_heist_passive_play_LOOTA_832',
				'dalaran_heist_passive_play_LOOTA_833',
				'dalaran_heist_passive_play_LOOTA_845',
				'dalaran_heist_passive_play_LOOTA_846',
			],
			'achievements_passive',
			conf,
		);
	}
}
