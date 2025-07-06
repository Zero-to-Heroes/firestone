import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { BgsBoard } from '@firestone-hs/hs-replay-xml-parser';
import { PatchInfo } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export const assignCompArchetype = (
	comps: readonly BgsCompAdvice[] | null,
	finalComp: BgsBoard | null,
	allCards: CardsFacadeService,
	currentBgPatch: PatchInfo | null,
): string | null => {
	if (!comps || !finalComp || !currentBgPatch) {
		return null;
	}

	const finalCompBaseCardIds = finalComp.board.map((entity) => {
		const card = allCards.getCard(entity.cardID);
		return card?.battlegroundsNormalDbfId ? allCards.getCard(card.battlegroundsNormalDbfId)?.id : card.id;
	});

	const enhancedComps = comps
		.filter((comp) => comp.patchNumber >= currentBgPatch.number)
		.map((comp) => ({
			comp: comp,
			numberOfCore: buildNumberOfCoreCards(comp, finalCompBaseCardIds),
			numberOfAddon: buildNumberOfAddonCards(comp, finalCompBaseCardIds),
			coreRatio: buildCoreCardsRatio(comp, finalCompBaseCardIds),
			addonRatio: buildAddonCardsRatio(comp, finalCompBaseCardIds),
		}));
	console.debug('[meta] [bgs] enhanced comps', enhancedComps);
	const sortedComps = enhancedComps
		// This needs to be refined, there probably need to be some sort of "weight" that we can assign to cards
		.filter(
			(comp) =>
				comp.numberOfCore >= 1 && comp.numberOfAddon >= 1 && (comp.coreRatio >= 0.5 || comp.numberOfAddon >= 3),
		)
		.sort((a, b) => b.coreRatio - a.coreRatio || b.numberOfAddon - a.numberOfAddon);
	return sortedComps[0]?.comp?.compId?.toLowerCase();
};

const buildNumberOfCoreCards = (comp: BgsCompAdvice, finalCompBaseCardIds: readonly string[]): number => {
	const coreCards = comp.cards.filter((card) => card.status === 'CORE');
	const coreCardsInFinalComp = finalCompBaseCardIds.filter((cardId) =>
		coreCards.some((coreCard) => coreCard.cardId === cardId),
	);
	return coreCardsInFinalComp.length;
};

const buildNumberOfAddonCards = (comp: BgsCompAdvice, finalCompBaseCardIds: readonly string[]): number => {
	const addonCards = comp.cards.filter((card) => card.status === 'ADDON');
	const addonCardsInFinalComp = finalCompBaseCardIds.filter((cardId) =>
		addonCards.some((addonCard) => addonCard.cardId === cardId),
	);
	return addonCardsInFinalComp.length;
};

const buildCoreCardsRatio = (comp: BgsCompAdvice, finalCompBaseCardIds: readonly string[]): number => {
	const coreCards = comp.cards.filter((card) => card.status === 'CORE');
	const coreCardsInFinalComp = finalCompBaseCardIds.filter((cardId) =>
		coreCards.some((coreCard) => coreCard.cardId === cardId),
	);
	return coreCardsInFinalComp.length / coreCards.length;
};

const buildAddonCardsRatio = (comp: BgsCompAdvice, finalCompBaseCardIds: readonly string[]): number => {
	const addonCards = comp.cards.filter((card) => card.status === 'ADDON');
	const addonCardsInFinalComp = finalCompBaseCardIds.filter((cardId) =>
		addonCards.some((addonCard) => addonCard.cardId === cardId),
	);
	return addonCardsInFinalComp.length / addonCards.length;
};
