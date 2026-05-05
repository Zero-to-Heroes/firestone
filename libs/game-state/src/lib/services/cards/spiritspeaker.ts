import { CardIds } from '@firestone-hs/reference-data';

import { animalCompanionTokenCardIds } from '../card-highlight/selectors';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const Spiritspeaker: StaticGeneratingCard = {
	cardIds: [CardIds.Spiritspeaker_MEND_301],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return input.inputOptions.deckState.newAnimalCompanions.length > 0
			? input.inputOptions.deckState.newAnimalCompanions
			: animalCompanionTokenCardIds;
	},
};
