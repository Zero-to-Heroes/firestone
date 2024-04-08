import { NonFunctionProperties } from '../../../services/utils';

export class NavigationDecktracker {
	// readonly currentView: DecktrackerViewType = 'decks';
	readonly menuDisplayType: string = 'menu';
	readonly selectedDeckstring: string;
	readonly selectedVersionDeckstring: string;
	// readonly selectedConstructedMetaDeck: string;
	// readonly selectedConstructedMetaArchetype: number;

	public update(base: Partial<NonFunctionProperties<NavigationDecktracker>>): NavigationDecktracker {
		return Object.assign(new NavigationDecktracker(), this, base);
	}
}
