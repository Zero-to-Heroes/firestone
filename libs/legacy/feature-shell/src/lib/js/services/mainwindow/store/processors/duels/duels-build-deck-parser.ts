import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { DuelsBuildDeckEvent } from '@services/mainwindow/store/events/duels/duels-build-deck-event';
import { extractDuelsClasses } from '@services/mainwindow/store/processors/duels/duels-deckbuilder-signature-treasure-selected-parser';
import { Processor } from '@services/mainwindow/store/processors/processor';

export class DuelsBuildDeckParser implements Processor {
	constructor(private readonly allCards: CardsFacadeService, private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: DuelsBuildDeckEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.mainNav.isVisible$$.next(true);
		return [
			currentState.update({
				duels: currentState.duels.update({
					deckbuilder: currentState.duels.deckbuilder.update({
						currentHeroCardId: event.heroCardId,
						currentHeroPowerCardId: event.heroPowerCardId,
						currentSignatureTreasureCardId: event.signatureTreasureCardId,
						currentClasses: extractDuelsClasses(
							event.heroCardId,
							event.heroPowerCardId,
							event.signatureTreasureCardId,
							this.allCards,
						),
					}),
				}),
			}),
			navigationState.update({
				currentApp: 'duels',
				navigationDuels: navigationState.navigationDuels.update({
					selectedCategoryId: 'duels-deckbuilder',
				}),
			}),
		];
	}
}
