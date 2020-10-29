import { AllCardsService } from '@firestone-hs/replay-parser';

const PASSIVES = [];

export const isPassive = (cardId: string, allCards: AllCardsService): boolean => {
	return PASSIVES.includes(cardId) || allCards.getCard(cardId)?.mechanics?.includes('DUNGEON_PASSIVE_BUFF');
};
