import { ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export const getCardInfoFilters = (card: DeckCard, allCards: CardsFacadeService): readonly CardInfoFilter[] => {
	const result: CardInfoFilter[] = [];
	if (!card) {
		return result;
	}

	const refCard = allCards.getCard(card.cardId);

	// Cost
	const cost = card.refManaCost ?? card.guessedInfo?.cost;
	if (cost != null) {
		result.push((c) => c.cost === cost);
	}
	// Spell school
	const spellSchools: readonly SpellSchool[] = refCard.spellSchool
		? ([SpellSchool[refCard.spellSchool]] as SpellSchool[])
		: card.guessedInfo?.spellSchools;
	if (spellSchools?.length) {
		result.push((c) => c.spellSchool && spellSchools.includes(SpellSchool[c.spellSchool]));
	}

	return result;
};

export type CardInfoFilter = (card: ReferenceCard) => boolean;
