import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MercenariesViewMercDetailsEvent } from '../../events/mercenaries/mercenaries-view-merc-details-event';
import { Processor } from '../processor';

export class MercenariesViewMercDetailsProcessor implements Processor {
	public async process(
		event: MercenariesViewMercDetailsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const refData = await currentState?.mercenaries?.referenceData;
		const refMerc = refData.mercenaries.find((merc) => merc.id === event.mercenaryId);
		return [
			null,
			navigationState.update({
				navigationMercenaries: navigationState.navigationMercenaries.update({
					selectedDetailsMercId: event.mercenaryId,
					selectedCategoryId: 'mercenaries-hero-details',
					menuDisplayType: 'breadcrumbs',
				}),
				text: refMerc?.name,
			}),
		];
	}
}
