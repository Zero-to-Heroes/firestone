/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const SpiritGuide: GeneratingCard = {
	cardIds: [CardIds.SpiritGuide],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.SPELL,
				spellSchools: [SpellSchool.HOLY],
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
				spellSchools: [SpellSchool.SHADOW],
			};
		}
		return null;
	},
};
