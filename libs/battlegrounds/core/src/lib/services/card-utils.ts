import { CardType, GameTag, ReferenceCard } from '@firestone-hs/reference-data';

export const isBgsTrinket = (card: ReferenceCard): boolean => {
	return card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET];
};

export const isBgsSpell = (card: ReferenceCard): boolean => {
	return card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL];
};

export const isBgsTimewarped = (card: ReferenceCard): boolean => {
	return card.mechanics?.includes(GameTag[GameTag.BACON_TIMEWARPED]);
};
