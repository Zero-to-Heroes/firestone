/* eslint-disable no-mixed-spaces-and-tabs */
// Agency Espionage (WORK_004)
// 4-Cost Rogue Spell
// "Shuffle a card from each other class into your deck. They cost (1). Draw one."
import { CardIds } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const ReplicatingSpore: StaticGeneratingCard = {
	cardIds: [CardIds.SporeEmpressMoldara_ReplicatingSporeToken_GDB_234t],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const summoned = input.inputOptions.deckState
			.getAllCardsInDeckWithoutOptions()
			.filter((c) => c.creatorCardId === CardIds.SporeEmpressMoldara_ReplicatingSporeToken_GDB_234t)
			// Won't work if two spores summon the same minion
			.map((c) => c.cardId as CardIds)
			// Remove duplicates
			.filter((c, index, self) => self.indexOf(c) === index);
		return summoned;
	},
};
