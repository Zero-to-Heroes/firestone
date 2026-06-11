import { CardType, GameTag, TrinketSlot, Zone } from '@firestone-hs/reference-data';
import {
	applySimulatorHeroPowerUpdate,
	BgsHeroPowerEntityLike,
	getSimulationActionHeroPowerEntries,
	getSimulatorHeroPowerCardIds,
	isBgsQuestRewardEntity,
	resolveBgsHeroPowerEntities,
	resolveTrinketHeroPowerCardId,
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

	it('ignores a mis-tagged portrait trinket in hero-power slot when it is already a regular trinket', () => {
		const portraitLesser = buildEntity({
			cardId: 'BG35_MagicItem_924',
			cardType: CardType.BATTLEGROUND_TRINKET,
			controller: playerId,
			zone: Zone.PLAY,
			tags: { [GameTag.TAG_SCRIPT_DATA_NUM_6]: TrinketSlot.LESSER },
		});
		const portraitHeroPowerSlot = buildEntity({
			cardId: 'BG35_MagicItem_924',
			cardType: CardType.BATTLEGROUND_TRINKET,
			controller: playerId,
			zone: Zone.PLAY,
			tags: {
				[GameTag.TAG_SCRIPT_DATA_NUM_6]: TrinketSlot.HERO_POWER,
				[GameTag.ADDITIONAL_HERO_POWER_INDEX]: 1,
			},
		});
		const primaryHeroPower = buildEntity({
			cardId: 'BG34_HERO_002p',
			cardType: CardType.HERO_POWER,
			controller: playerId,
			zone: Zone.PLAY,
		});
		const secondaryHeroPower = buildEntity({
			cardId: 'BG35_Anomaly_008t',
			cardType: CardType.HERO_POWER,
			controller: playerId,
			zone: Zone.PLAY,
			tags: { [GameTag.ADDITIONAL_HERO_POWER_INDEX]: 1 },
		});

		const result = resolveBgsHeroPowerEntities(
			[portraitLesser, portraitHeroPowerSlot, secondaryHeroPower, primaryHeroPower],
			playerId,
		);
		expect(result.map((entity) => entity.cardID)).toEqual(['BG34_HERO_002p', 'BG35_Anomaly_008t']);
	});

	it('returns only the trinket-as-hero-power when slot 3 is occupied', () => {
		const trinketHeroPower = buildEntity({
			cardId: 'TRINKET_HP',
			cardType: CardType.BATTLEGROUND_TRINKET,
			controller: playerId,
			zone: Zone.PLAY,
			tags: { [GameTag.TAG_SCRIPT_DATA_NUM_6]: TrinketSlot.HERO_POWER },
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

	it('returns both simulator hero powers from heroPowerId and heroPowers', () => {
		const cardIds = getSimulatorHeroPowerCardIds({
			heroPowerId: 'HP_PRIMARY',
			heroPowers: [{ cardId: 'HP_SECONDARY' } as any],
			trinkets: [],
		});

		expect(cardIds).toEqual(['HP_PRIMARY', 'HP_SECONDARY']);
	});

	it('returns null for duplicate portrait trinket in hero-power slot', () => {
		expect(
			resolveTrinketHeroPowerCardId([
				{ cardId: 'BG35_MagicItem_924', scriptDataNum6: TrinketSlot.LESSER },
				{
					cardId: 'BG35_MagicItem_924',
					scriptDataNum6: TrinketSlot.HERO_POWER,
					tags: { [GameTag.ADDITIONAL_HERO_POWER_INDEX]: 1 },
				},
			]),
		).toBeNull();
	});

	it('uses real hero powers for encoded simulation when slot-3 trinket is a duplicate portrait', () => {
		const trinkets = [
			{ cardId: 'BG35_MagicItem_731', scriptDataNum6: TrinketSlot.GREATER },
			{
				cardId: 'BG35_MagicItem_731',
				entityId: 282,
				scriptDataNum6: TrinketSlot.HERO_POWER,
				tags: { [GameTag.ADDITIONAL_HERO_POWER_INDEX]: 1 },
			},
		];
		const heroPowers = [{ cardId: 'BG34_HERO_002p', entityId: 231, used: false }];

		expect(getSimulatorHeroPowerCardIds({ heroPowers, trinkets } as any)).toEqual(['BG34_HERO_002p']);
		expect(
			getSimulationActionHeroPowerEntries(
				'BG35_MagicItem_731',
				100000002,
				false,
				heroPowers,
				trinkets,
				null,
				100000002,
				100000003,
			).map((entry) => entry.cardId),
		).toEqual(['BG34_HERO_002p']);
	});

	it('extracts primary and secondary hero powers from simulation game actions', () => {
		const entries = getSimulationActionHeroPowerEntries(
			'HP_PRIMARY',
			100000002,
			false,
			[
				{ cardId: 'HP_PRIMARY', entityId: 100000002, used: false },
				{ cardId: 'HP_SECONDARY', entityId: 100000003, used: true },
			],
			[],
			null,
			100000002,
			100000003,
		);

		expect(entries).toEqual([
			{ cardId: 'HP_PRIMARY', entityId: 100000002, used: false, additionalHeroPowerIndex: 0 },
			{ cardId: 'HP_SECONDARY', entityId: 100000003, used: true, additionalHeroPowerIndex: 1 },
		]);
	});

	it('does not treat secondary hero powers as quest rewards in simulation actions', () => {
		const entries = getSimulationActionHeroPowerEntries(
			'HP_PRIMARY',
			100000002,
			false,
			[{ cardId: 'HP_PRIMARY' }, { cardId: 'HP_SECONDARY' }] as any,
			[],
			null,
			100000002,
			100000003,
		);

		expect(entries.filter((entry) => entry.additionalHeroPowerIndex > 0)).toHaveLength(1);
		expect(entries[1].cardId).toBe('HP_SECONDARY');
	});

	it('stores a second simulator hero power at index 1', () => {
		const updated = applySimulatorHeroPowerUpdate(
			{
				heroPowerId: 'HP_PRIMARY',
				heroPowers: [],
			} as any,
			1,
			'HP_SECONDARY',
			0,
		);

		expect(getSimulatorHeroPowerCardIds(updated)).toEqual(['HP_PRIMARY', 'HP_SECONDARY']);
	});
});
