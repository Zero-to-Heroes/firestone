import { DecktrackerViewType } from '../decktracker/decktracker-view.type';

export class NavigationDecktracker {
	readonly currentView: DecktrackerViewType = 'decks';
	readonly menuDisplayType: string = 'menu';
	readonly selectedDeckstring: string;
	readonly showMatchupAsPercentages: boolean;

	public update(base: NavigationDecktracker): NavigationDecktracker {
		return Object.assign(new NavigationDecktracker(), this, base);
	}
}
