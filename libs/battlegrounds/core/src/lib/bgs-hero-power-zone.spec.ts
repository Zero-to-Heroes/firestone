import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import {
	BgsHeroPowerEntityLike,
	isBgsQuestRewardEntity,
	resolveBgsHeroPowerEntities,
} from './bgs-hero-power-zone';

const buildEntity = (
	overrides: Partial<{
		cardId: string;
		cardType: CardType;
		controller: number;
		zone: Zone;
		tags: Partial<Record<GameTag, number>>;
	}>,
): BgsHeroPowerEntityLike => {
	const tags: Partial<Record<GameTag, number>> = {
		[GameTag.CARDTYPE]: overrides.cardType,
		[GameTag.CONTROLLER]: overrides.controller,
		[GameTag.ZONE]: overrides.zone,
		...overrides.tags,
	};
	return {
		getTag: (tag) => tags[tag] ?? -1,
		getCardType: () => tags[GameTag.CARDTYPE] ?? -1,
		getZone: () => tags[GameTag.ZONE] ?? -1,
		cardID: overrides.cardId ?? '',
	};
};

describe('bgs-hero-power-zone', () => {
	const playerId = 2;

	it('returns a single hero power when only one is in play', () => {
		const entities = [
			buildEntity({
				cardId: 'HP_PRIMARY',
				cardType: CardType.HERO_POWER,
				controller: playerId,
				zone: Zone.PLAY,
				tags: { [GameTag.ADDITIONAL_HERO_POWER_INDEX]: 0 },
			}),
		];

		expect(resolveBgsHeroPowerEntities(entities, playerId)).toHaveLength(1);
		expect(resolveBgsHeroPowerEntities(entities, playerId)[0].cardID).toBe('HP_PRIMARY');
	});

	it('returns both hero powers sorted by additional index (anomaly case)', () => {
		const secondary = buildEntity({
			cardId: 'HP_SECONDARY',
			cardType: CardType.HERO_POWER,
			controller: playerId,
			zone: Zone.PLAY,
			tags: { [GameTag.ADDITIONAL_HERO_POWER_INDEX]: 1 },
		});
		const primary = buildEntity({
			cardId: 'HP_PRIMARY',
			cardType: CardType.HERO_POWER,
			controller: playerId,
			zone: Zone.PLAY,
			tags: { [GameTag.ADDITIONAL_HERO_POWER_INDEX]: 0 },
		});

		const result = resolveBgsHeroPowerEntities([secondary, primary], playerId);
		expect(result.map((entity) => entity.cardID)).toEqual(['HP_PRIMARY', 'HP_SECONDARY']);
	});

	it('does not treat additional hero power index as a quest reward', () => {
		const secondHeroPower = buildEntity({
			cardId: 'HP_SECONDARY',
			cardType: CardType.HERO_POWER,
			controller: playerId,
			zone: Zone.PLAY,
			tags: { [GameTag.ADDITIONAL_HERO_POWER_INDEX]: 1 },
		});

		expect(isBgsQuestRewardEntity(secondHeroPower)).toBe(false);
	});

	it('returns only the trinket-as-hero-power when slot 3 is occupied', () => {
		const trinketHeroPower = buildEntity({
			cardId: 'TRINKET_HP',
			cardType: CardType.BATTLEGROUND_TRINKET,
			controller: playerId,
			zone: Zone.PLAY,
			tags: { [GameTag.TAG_SCRIPT_DATA_NUM_6]: 3 },
		});
		const regularHeroPower = buildEntity({
			cardId: 'HP_PRIMARY',
			cardType: CardType.HERO_POWER,
			controller: playerId,
			zone: Zone.PLAY,
		});

		const result = resolveBgsHeroPowerEntities([regularHeroPower, trinketHeroPower], playerId);
		expect(result).toHaveLength(1);
		expect(result[0].cardID).toBe('TRINKET_HP');
	});

	it('identifies non-hero-power quest rewards', () => {
		const questReward = buildEntity({
			cardId: 'QUEST_REWARD',
			cardType: CardType.BATTLEGROUND_QUEST_REWARD,
			controller: playerId,
			zone: Zone.PLAY,
		});

		expect(isBgsQuestRewardEntity(questReward)).toBe(true);
	});
});
