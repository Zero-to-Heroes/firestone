/* eslint-disable no-mixed-spaces-and-tabs */
// Agency Espionage (WORK_004)
// 4-Cost Rogue Spell
// "Shuffle a card from each other class into your deck. They cost (1). Draw one."
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

const POISON_CARDS = [
	CardIds.DeadlyPoisonCore,
	CardIds.LeechingPoison_CORE_ICC_221,
	CardIds.ParalyticPoison,
	CardIds.SilverleafPoison,
	CardIds.NitroboostPoison,
];

export const ApothecaryHelbrim: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ApothecaryHelbrim],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = POISON_CARDS;
		return {
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return POISON_CARDS;
	},
};
