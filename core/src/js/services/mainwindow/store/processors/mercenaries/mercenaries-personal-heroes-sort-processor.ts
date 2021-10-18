import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MercenariesPersonalHeroesSortCriteria } from '../../../../../models/mercenaries/personal-heroes-sort-criteria.type';
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
		const existingCriteria = prefs.mercenariesPersonalHeroesSortCriteria;
		const existingDirection = existingCriteria.find((crit) => crit.criteria === event.criteria)?.direction;
		const newCriteria: readonly MercenariesPersonalHeroesSortCriteria[] = [
			// Sort descending by default, as it seems to be the most frequent use case
			{ criteria: event.criteria, direction: existingDirection === 'desc' ? 'asc' : 'desc' },
			...existingCriteria.filter((crit) => crit.criteria !== event.criteria),
		];
		this.prefs.updateMercenariesPersonalHeroesSortCriteria(newCriteria);
		return [null, null];
	}
}
