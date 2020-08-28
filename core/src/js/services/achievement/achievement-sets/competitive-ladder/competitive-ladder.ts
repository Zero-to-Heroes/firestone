import { GenericSetProvider } from '../generic-set-provider';

export class CompetitiveLadderSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'competitive_ladder',
			'Ladder',
			[
				'competitive_ladder_nemesis_demonhunter',
				'competitive_ladder_nemesis_druid',
				'competitive_ladder_nemesis_hunter',
				'competitive_ladder_nemesis_mage',
				'competitive_ladder_nemesis_paladin',
				'competitive_ladder_nemesis_priest',
				'competitive_ladder_nemesis_rogue',
				'competitive_ladder_nemesis_shaman',
				'competitive_ladder_nemesis_warlock',
				'competitive_ladder_nemesis_warrior',
			],
			'achievements_competitive_ladder',
		);
	}
}
