const PASSIVES = [];

export const isPassive = (cardId: string): boolean => {
	return PASSIVES.includes(cardId) || cardId.toLowerCase().includes('passive');
};
