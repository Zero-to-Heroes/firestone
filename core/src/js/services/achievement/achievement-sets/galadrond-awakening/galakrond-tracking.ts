import { GenericSetProvider } from '../generic-set-provider';

export class GalakrondTrackingSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'galakrond_tracking',
			'Tracking',
			[
				'galakrond_coin_spent',
				'galakrond_damage_to_enemy_heroes',
				'galakrond_enemy_minions_dead',
				'galakrond_total_duration',
				'galakrond_total_match',
			],
			'achievements_progression',
		);
	}
}
