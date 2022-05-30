import { CardClass, CardIds, normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DuelsDeckbuilderSignatureTreasureSelectedEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-signature-treasure-selected-decks-event';
import { Processor } from '@services/mainwindow/store/processors/processor';

const NEUTRAL_HEROES = [CardIds.VanndarStormpikeTavernBrawl, CardIds.DrektharTavernBrawl];

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
		// Neutral heroes' class is determined by their signature treasure
		if (
			NEUTRAL_HEROES.includes(
				normalizeDuelsHeroCardId(currentState.duels.deckbuilder.currentHeroCardId) as CardIds,
			)
		) {
			classes = extractDuelsClasses(event.signatureTreasureCardId, this.allCards);
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

export const extractDuelsClasses = (signatureTreasureCardId: string, allCards: CardsFacadeService): CardClass[] => {
	const sigTreasureCard = allCards.getCard(signatureTreasureCardId);
	if (sigTreasureCard?.cardClass !== CardClass[CardClass.NEUTRAL]) {
		return [CardClass[sigTreasureCard.cardClass]];
	}
	return [];
};
