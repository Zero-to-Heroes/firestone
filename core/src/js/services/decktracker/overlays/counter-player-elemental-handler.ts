import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class ElementalPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: AllCardsService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_ELEMENTAL_WINDOW,
			prefs => prefs.playerElementalCounter,
			state =>
				this.containsCards(state?.playerDeck?.hand, [
					CardIds.Collectible.Mage.ManaCyclone,
					CardIds.Collectible.Mage.GrandFinale,
					CardIds.Collectible.Neutral.Ozruk,
				]) && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}

	private containsCards(zone: readonly DeckCard[], cardIds: string[]): boolean {
		return (zone || []).some(card => cardIds.includes(card.cardId));
	}
}
