// Velarok, the Deceiver (WW_364t)
// 3-Cost Rogue Legendary Minion
// "Charge. After this attacks, Discover a card from another class. It costs (3) less."
import { ALL_CLASSES, CardClass, CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const VelarokTheDeceiver: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.VelarokWindblade_VelarokTheDeceiverToken_WW_364t],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			VelarokTheDeceiver.cardIds[0],
			input.allCards,
			(c) => fromAnotherClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const otherClasses = ALL_CLASSES.filter((c) => c !== currentClass?.toLowerCase()).map(
			(c) => CardClass[c.toUpperCase() as keyof typeof CardClass],
		);
		const possibleCards = filterCards(
			VelarokTheDeceiver.cardIds[0],
			input.allCards,
			(c) => fromAnotherClass(c, currentClass),
			input.options,
		);
		return {
			cardClasses: otherClasses,
			possibleCards: possibleCards,
		};
	},
};
