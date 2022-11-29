import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import {
	MercenariesPersonalHeroesSortCriteria,
	MercenariesPersonalHeroesSortCriteriaDirection,
} from '../../../../../models/mercenaries/personal-heroes-sort-criteria.type';
import { PreferencesService } from '../../../../preferences.service';
import { MercenariesPersonalHeroesSortEvent } from '../../events/mercenaries/mercenaries-personal-heroes-sort-event';
import { Processor } from '../processor';

export class MercenariesPersonalHeroesSortProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesPersonalHeroesSortEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const existingCriterion = prefs.mercenariesPersonalHeroesSortCriterion;
		const existingDirection = existingCriterion?.direction;
		const newCriteria: MercenariesPersonalHeroesSortCriteria = {
			criteria: event.criteria,
			// Sort descending by default, as it seems to be the most frequent use case, except for the name
			direction:
				existingDirection === null && event.criteria === 'name' ? 'asc' : invertDirection(existingDirection),
		};
		this.prefs.updateMercenariesPersonalHeroesSortCriteria(newCriteria);
		return [null, null];
	}
}

const invertDirection = (
	direction: MercenariesPersonalHeroesSortCriteriaDirection,
): MercenariesPersonalHeroesSortCriteriaDirection => {
	switch (direction) {
		case 'asc':
			return 'desc';
		case 'desc':
			return 'asc';
		default:
			return 'desc';
	}
};
