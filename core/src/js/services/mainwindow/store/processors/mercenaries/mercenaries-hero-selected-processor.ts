import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationMercenaries } from '../../../../../models/mainwindow/navigation/navigation-mercenaries';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CardsFacadeService } from '../../../../cards-facade.service';
import { MercenariesHeroSelectedEvent } from '../../events/mercenaries/mercenaries-hero-selected-event';
import { Processor } from '../processor';

export class MercenariesHeroSelectedProcessor implements Processor {
	constructor(private readonly allCards: CardsFacadeService) {}

	public async process(
		event: MercenariesHeroSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const nav = navigationState.update({
			navigationMercenaries: navigationState.navigationMercenaries.update({
				selectedCategoryId: `mercenaries-hero-details`,
				selectedHeroId: event.heroId,
				menuDisplayType: 'breadcrumbs',
			} as NavigationMercenaries),
			text: this.allCards.getCard(event.heroId)?.name ?? event.heroId,
		} as NavigationState);
		return [null, nav];
	}
}
