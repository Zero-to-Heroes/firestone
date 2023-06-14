import { CardClass, CardIds, normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
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
			classes = extractDuelsClasses(
				currentState.duels.deckbuilder.currentHeroCardId,
				currentState.duels.deckbuilder.currentHeroPowerCardId,
				event.signatureTreasureCardId,
				this.allCards,
			);
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

export const extractDuelsClasses = (
	heroCardId: string,
	heroPowerCardId: string,
	signatureTreasureCardId: string,
	allCards: CardsFacadeService,
): CardClass[] => {
	const heroCard = allCards.getCard(heroCardId);
	if (!!heroCard?.classes?.length && !heroCard.classes.includes(CardClass[CardClass.NEUTRAL])) {
		return heroCard?.classes?.map((cls) => CardClass[cls]);
	}

	const heroPowerCard = allCards.getCard(heroPowerCardId);
	if (!!heroPowerCard?.classes?.length && !heroPowerCard.classes.includes(CardClass[CardClass.NEUTRAL])) {
		return heroPowerCard.classes?.map((cls) => CardClass[cls]);
	}

	const sigTreasureCard = allCards.getCard(signatureTreasureCardId);
	if (!!sigTreasureCard?.classes?.length && !sigTreasureCard.classes.includes(CardClass[CardClass.NEUTRAL])) {
		return sigTreasureCard.classes?.map((cls) => CardClass[cls]);
	}
	return [];
};
