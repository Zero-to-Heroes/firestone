import { CardClass } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { DuelsDeckbuilderHeroSelectedEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-hero-selected-decks-event';
import { Processor } from '@services/mainwindow/store/processors/processor';

export class DuelsDeckbuilderHeroSelectedProcessor implements Processor {
	constructor(private readonly allCards: CardsFacadeService) {}

	public async process(
		event: DuelsDeckbuilderHeroSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const heroCardId = event.heroCardId;
		const classes: CardClass[] = this.allCards.getCard(heroCardId)?.classes?.map((c) => CardClass[c]) ?? [];
		return [
			currentState.update({
				duels: currentState.duels.update({
					deckbuilder: currentState.duels.deckbuilder.update({
						currentHeroCardId: event.heroCardId,
						currentClasses: classes,
					}),
				}),
			}),
			null,
		];
	}
}
