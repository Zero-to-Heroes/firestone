import { CardIds } from '@firestone-hs/reference-data';

import { animalCompanionTokenCardIds } from '../card-highlight/selectors';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const CallOfTheWild: StaticGeneratingCard = {
	cardIds: [CardIds.CallOfTheWild, CardIds.CallOfTheWild_CORE_OG_211],
	overrideDefaultDynamicPool: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return input.inputOptions.deckState.newAnimalCompanions.length > 0
			? input.inputOptions.deckState.newAnimalCompanions
			: animalCompanionTokenCardIds;
	},
};
