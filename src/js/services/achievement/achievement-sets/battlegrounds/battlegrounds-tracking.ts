import { GenericSetProvider } from '../generic-set-provider';

export class BattlegroundsTrackingSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'battlegrounds_tracking',
			'Tracking',
			[
				'battlegrounds_coin_spent',
				'battlegrounds_damage_to_enemy_heroes',
				'battlegrounds_eliminate_other_players',
				'battlegrounds_enemy_minions_dead',
				'battlegrounds_lock_all',
				'battlegrounds_reroll_tavern',
				'battlegrounds_tavern_upgrade',
				'battlegrounds_total_duration',
				'battlegrounds_total_match',
			],
			'achievements_progression',
		);
	}
}
