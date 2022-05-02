import { CardClass } from '@firestone-hs/reference-data';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DuelsDeckbuilderSignatureTreasureSelectedEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-signature-treasure-selected-decks-event';
import { Processor } from '@services/mainwindow/store/processors/processor';

export class DuelsDeckbuilderSignatureTreasureSelectedProcessor implements Processor {
	constructor(private readonly allCards: CardsFacadeService) {}

	public async process(
		event: DuelsDeckbuilderSignatureTreasureSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const signatureTreasureCardId = event.signatureTreasureCardId;
		let classes = currentState.duels.deckbuilder.currentClasses;
		// Neutral heroes
		if (!classes?.length) {
			const sigTreasureCard = this.allCards.getCard(signatureTreasureCardId);
			if (sigTreasureCard?.cardClass !== CardClass[CardClass.NEUTRAL]) {
				classes = [CardClass[sigTreasureCard.cardClass]];
			}
		}
		return [
			currentState.update({
				duels: currentState.duels.update({
					deckbuilder: currentState.duels.deckbuilder.update({
						currentSignatureTreasureCardId: signatureTreasureCardId,
						currentClasses: classes,
					}),
				}),
			}),
			null,
		];
	}
}
