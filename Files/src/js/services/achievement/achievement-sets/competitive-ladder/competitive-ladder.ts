import { GenericSetProvider } from '../generic-set-provider';

export class CompetitiveLadderSetProvider extends GenericSetProvider {
	constructor() {
		super('competitive_ladder', 'Competitive Ladder', ['competitive_ladder_win_streak'], 'achievements_competitive_ladder');
	}
}
