/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const RunicInscriptions: GeneratingCard & StaticGeneratingCard = {
	cardIds: [
		CardIds.EliseTheNavigator_RunicInscriptionsToken_TLC_100t13,
		CardIds.EliseTheNavigator_RunicInscriptionsToken_TLC_100t23,
		CardIds.EliseTheNavigator_RunicInscriptionsToken_TLC_100t33,
	],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				input.card.creatorCardId ?? '',
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, currentClass),
				input.options,
			),
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Runic Inscriptions discovers a spell
		// The spell pool should be all discoverable spells from the current class
		return filterCards(
			input.cardId,
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
