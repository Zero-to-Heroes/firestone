import { GenericSetProvider } from '../generic-set-provider';

export class BattlegroundsTrackingSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'battlegrounds_tracking',
			'Tracking',
			[
				'battlegrounds_coin_spent',
				'battlegrounds_damage_to_enemy_heroes',
				'battlegrounds_enemy_minions_dead',
				'battlegrounds_total_duration',
				'battlegrounds_total_match',
			],
			'achievements_progression',
		);
	}
}
