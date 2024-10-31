import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export const buildCompositions = (
	availableTribes: readonly Race[],
	strategies: readonly BgsCompAdvice[],
	allCards: CardsFacadeService,
): readonly BgsCompAdvice[] => {
	// return strategies;
	return (
		strategies?.filter((s) => {
			const result = isAvailable(s, availableTribes, allCards);
			// console.debug(
			// 	'isAvailableStat',
			// 	s.compId,
			// 	availableTribes,
			// 	result,
			// 	// s,
			// 	s.cards
			// 		.filter((c) => c.status === 'CORE')
			// 		.map((c) => allCards.getCard(c.cardId))
			// 		.map((c) => ({ name: c.name, available: isCardAvailable(c, availableTribes) })),
			// 	s,
			// );
			return result;
		}) ?? []
	);
};

const isAvailable = (comp: BgsCompAdvice, availableTribes: readonly Race[], allCards: CardsFacadeService): boolean => {
	return comp.cards
		.filter((c) => c.status === 'CORE')
		.map((c) => allCards.getCard(c.cardId))
		.every((c) => isCardAvailable(c, availableTribes));
};

const isCardAvailable = (card: ReferenceCard, availableTribes: readonly Race[]): boolean => {
	return !card.races?.length || !availableTribes?.length || card.races.some((r) => availableTribes.includes(Race[r]));
};
