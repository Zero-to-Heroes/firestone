/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Cosmic Manifestations (JAIL_892)
 * Deal 2 damage. Shuffle a random Demon Hunter spell into your deck. Outcast: Do it again.
 */
import { CardClass, CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const dhSpellFilter = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.DEMONHUNTER);

export const CosmicManifestations: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CosmicManifestations_JAIL_892],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.CosmicManifestations_JAIL_892,
			input.allCards,
			dhSpellFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		cardClasses: [CardClass.DEMONHUNTER],
		possibleCards: filterCards(
			CardIds.CosmicManifestations_JAIL_892,
			input.allCards,
			dhSpellFilter,
			input.options,
		),
	}),
};
