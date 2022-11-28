import { NonFunctionProperties } from '../../../services/utils';
import { DecktrackerViewType } from '../decktracker/decktracker-view.type';

export class NavigationDecktracker {
	readonly currentView: DecktrackerViewType = 'decks';
	readonly menuDisplayType: string = 'menu';
	readonly selectedDeckstring: string;
	readonly selectedVersionDeckstring: string;

	public update(base: Partial<NonFunctionProperties<NavigationDecktracker>>): NavigationDecktracker {
		return Object.assign(new NavigationDecktracker(), this, base);
	}

	public getPageName(): string {
		return this.currentView;
	}
}
