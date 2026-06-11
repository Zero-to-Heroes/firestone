import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';

export interface BgsHeroPowerEntityLike {
	getTag(tag: GameTag): number;
	getCardType(): number;
	getZone(): number;
	cardID?: string;
	getCardId?(): string;
}

const getEntityCardId = (entity: BgsHeroPowerEntityLike): string => entity.getCardId?.() ?? entity.cardID ?? '';

export const adaptReplayHeroPowerEntity = (entity: {
	cardID: string;
	getTag(tag: GameTag): number;
	getCardType(): number;
	getZone(): number;
}): BgsHeroPowerEntityLike => ({
	getTag: (tag) => entity.getTag(tag),
	getCardType: () => entity.getCardType(),
	getZone: () => entity.getZone(),
	getCardId: () => entity.cardID,
});

export const adaptParserHeroPowerEntity = (entity: {
	CardId: string;
	GetTag(tag: GameTag, defaultValue?: number): number;
	GetCardType(): number;
}): BgsHeroPowerEntityLike => ({
	getTag: (tag) => entity.GetTag(tag, -1),
	getCardType: () => entity.GetCardType(),
	getZone: () => entity.GetTag(GameTag.ZONE, -1),
	getCardId: () => entity.CardId,
});

export const resolveBgsHeroPowerEntities = <T extends BgsHeroPowerEntityLike>(
	entities: readonly T[],
	playerId: number,
): readonly T[] => {
	if (!entities?.length || !playerId) {
		return [];
	}

	const playerPlayEntities = entities.filter(
		(entity) => entity.getTag(GameTag.CONTROLLER) === playerId && entity.getZone() === Zone.PLAY,
	);

	const trinketHeroPower = playerPlayEntities.find(
		(entity) =>
			entity.getCardType() === CardType.BATTLEGROUND_TRINKET &&
			entity.getTag(GameTag.TAG_SCRIPT_DATA_NUM_6) === 3,
	);
	if (trinketHeroPower) {
		return [trinketHeroPower];
	}

	const questHeroPowerRewards = playerPlayEntities.filter(
		(entity) =>
			entity.getCardType() === CardType.BATTLEGROUND_QUEST_REWARD &&
			entity.getTag(GameTag.BACON_IS_HEROPOWER_QUESTREWARD) === 1,
	);
	if (questHeroPowerRewards.length) {
		return questHeroPowerRewards;
	}

	return playerPlayEntities
		.filter((entity) => entity.getCardType() === CardType.HERO_POWER)
		.sort(
			(a, b) =>
				(a.getTag(GameTag.ADDITIONAL_HERO_POWER_INDEX) || 0) -
				(b.getTag(GameTag.ADDITIONAL_HERO_POWER_INDEX) || 0),
		);
};

export const resolveBgsHeroPowerCardIds = (
	entities: readonly BgsHeroPowerEntityLike[],
	playerId: number,
): readonly string[] =>
	resolveBgsHeroPowerEntities(entities, playerId)
		.map((entity) => getEntityCardId(entity))
		.filter((cardId): cardId is string => !!cardId);

export const isBgsQuestRewardEntity = (entity: BgsHeroPowerEntityLike): boolean =>
	entity.getTag(GameTag.CARDTYPE) === CardType.BATTLEGROUND_QUEST_REWARD &&
	entity.getTag(GameTag.BACON_IS_HEROPOWER_QUESTREWARD) !== 1;

export const mergeBgsHeroPowerCardIds = (
	...sources: (readonly string[] | string | null | undefined)[]
): readonly string[] => {
	const result: string[] = [];
	for (const source of sources) {
		if (!source) {
			continue;
		}
		const cardIds = Array.isArray(source) ? source : [source];
		for (const cardId of cardIds) {
			if (cardId && !result.includes(cardId)) {
				result.push(cardId);
			}
		}
	}
	return result;
};
