import { LocalizationFacadeService } from '@services/localization-facade.service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationMercenaries } from '../../../../../models/mainwindow/navigation/navigation-mercenaries';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MercenariesSelectCompositionEvent } from '../../events/mercenaries/mercenaries-select-composition-event';
import { Processor } from '../processor';

export class MercenariesSelectCompositionProcessor implements Processor {
	constructor(private readonly i18n: LocalizationFacadeService) {}

	public async process(
		event: MercenariesSelectCompositionEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const nav = navigationState.update({
			navigationMercenaries: navigationState.navigationMercenaries.update({
				selectedCategoryId: `mercenaries-composition-details`,
				selectedCompositionId: event.compositionId,
				menuDisplayType: 'breadcrumbs',
			} as NavigationMercenaries),
			text: this.i18n.translateString('app.mercenaries.menu.composition-details'),
		} as NavigationState);
		return [null, nav];
	}
}
