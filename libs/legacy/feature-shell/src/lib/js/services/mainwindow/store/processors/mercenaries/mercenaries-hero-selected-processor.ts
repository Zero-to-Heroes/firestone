import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MercenariesHeroSelectedEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class MercenariesHeroSelectedProcessor implements Processor {
	constructor(private readonly allCards: CardsFacadeService) {}

	public async process(
		event: MercenariesHeroSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		// const nav = navigationState.update({
		// 	navigationMercenaries: navigationState.navigationMercenaries.update({
		// 		selectedCategoryId: `mercenaries-meta-hero-details`,
		// 		selectedHeroId: event.heroId,
		// 		menuDisplayType: 'breadcrumbs',
		// 	} as NavigationMercenaries),
		// 	text: this.allCards.getCard(event.heroId)?.name ?? event.heroId,
		// } as NavigationState);
		return [null, null];
	}
}
