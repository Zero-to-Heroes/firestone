import {
	MainWindowState,
	MercenariesPersonalHeroesSortEvent,
	NavigationState,
} from '../../store-internal';
import {
	MercenariesPersonalHeroesSortCriteria,
	MercenariesPersonalHeroesSortCriteriaDirection,
} from '@firestone/mercenaries/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { Processor } from '../processor';

export class MercenariesPersonalHeroesSortProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesPersonalHeroesSortEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
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
