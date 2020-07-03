import { GenericSetProvider } from '../generic-set-provider';

export class ThijsSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'thijs',
			'Thijs',
			[
				'thijs_attack_multiple_times',
				'thijs_big_deck',
				'thijs_close_call',
				'thijs_echo_cavern',
				'thijs_heal',
				'thijs_no_minions',
				'thijs_no_spells',
				'thijs_quick_win',
				'thijs_secrets',
				'thijs_tea_time',
				'thijs_thijs',
				'thijs_total_damage',
				'thijs_untouchable',
				'thijs_whoneedscards',
			],
			'achievements_shrine',
		);
	}
}
