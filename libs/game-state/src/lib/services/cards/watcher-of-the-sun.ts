/* eslint-disable no-mixed-spaces-and-tabs */
// Watcher of the Sun (TTN_039 / TTN_039t): 2 Mana 2/3
// "<b>Battlecry:</b> Get a random Holy spell. <b>Forge:</b> Also restore #6 Health to your hero."

import { CardIds, CardType, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.SPELL) && c?.spellSchool?.includes(SpellSchool[SpellSchool.HOLY]);

export const WatcherOfTheSun: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WatcherOfTheSun, CardIds.WatcherOfTheSun_WatcherOfTheSunToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(WatcherOfTheSun.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(WatcherOfTheSun.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, spellSchools: [SpellSchool.HOLY], possibleCards };
	},
};
