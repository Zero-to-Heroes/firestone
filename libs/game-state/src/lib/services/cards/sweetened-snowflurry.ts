/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const SweetenedSnowflurry: GeneratingCard = {
	cardIds: [CardIds.SweetenedSnowflurry_TOY_307, CardIds.SweetenedSnowflurry_SweetenedSnowflurryToken_TOY_307t],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			mechanics: [GameTag.SECRET],
			spellSchools: [SpellSchool.FROST],
		};
	},
};
