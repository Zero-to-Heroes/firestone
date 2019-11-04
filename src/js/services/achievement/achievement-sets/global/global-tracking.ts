import { GenericSetProvider } from '../generic-set-provider';

export class GlobalTrackingSetProvider extends GenericSetProvider {
	constructor() {
		super('global_tracking', 'Tracking', ['global_damage_to_enemy_heroes'], 'tracking');
	}
}
