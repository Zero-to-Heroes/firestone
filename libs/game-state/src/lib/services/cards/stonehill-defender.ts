/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Stonehill Defender (UNG_072 / Core_UNG_072)
 * Taunt. Battlecry: Discover a Taunt minion.
 */
import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const tauntMinionFilter = (c: ReferenceCard, currentClass: string | undefined) =>
	hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.TAUNT) && canBeDiscoveredByClass(c, currentClass);

export const StonehillDefender: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.StonehillDefender, CardIds.StonehillDefender_Core_UNG_072],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			StonehillDefender.cardIds[0],
			input.allCards,
			(c) => tauntMinionFilter(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.MINION,
			mechanics: [GameTag.TAUNT],
			possibleCards: filterCards(
				StonehillDefender.cardIds[0],
				input.allCards,
				(c) => tauntMinionFilter(c, currentClass),
				input.options,
			),
		};
	},
};
