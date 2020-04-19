import { DecktrackerViewType } from '../decktracker/decktracker-view.type';

export class NavigationDecktracker {
	readonly currentView: DecktrackerViewType = 'decks';
	readonly menuDisplayType: string = 'menu';

	public update(base: NavigationDecktracker): NavigationDecktracker {
		return Object.assign(new NavigationDecktracker(), this, base);
	}
}
