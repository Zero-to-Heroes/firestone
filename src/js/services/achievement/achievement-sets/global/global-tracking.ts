import { GenericSetProvider } from '../generic-set-provider';

export class GlobalTrackingSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'global_tracking',
			'Tracking',
			[
				'global_damage_to_enemy_heroes',
				'global_enemy_minions_dead',
				'global_mana_spent',
				'global_total_duration',
			],
			'tracking',
		);
	}
}
