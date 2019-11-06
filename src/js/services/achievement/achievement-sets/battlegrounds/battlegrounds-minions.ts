import { GenericSetProvider } from '../generic-set-provider';

export class BattlegroundsMinionsSetProvider extends GenericSetProvider {
	constructor() {
		super('battlegrounds_minions', 'Minions', [], 'achievements_treasure');
	}
}
