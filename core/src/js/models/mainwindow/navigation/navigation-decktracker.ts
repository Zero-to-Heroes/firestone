import { DecktrackerViewType } from '../decktracker/decktracker-view.type';

export class NavigationDecktracker {
	readonly currentView: DecktrackerViewType = 'decks';
	readonly menuDisplayType: string = 'menu';
	readonly selectedDeckstring: string;

	public update(base: NavigationDecktracker): NavigationDecktracker {
		return Object.assign(new NavigationDecktracker(), this, base);
	}

	public getPageName(): string {
		return this.currentView;
	}
}
