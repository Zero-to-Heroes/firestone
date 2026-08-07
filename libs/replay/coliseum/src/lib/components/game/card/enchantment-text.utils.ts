import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone/replay/replay-parser';

const SCRIPT_DATA_TAGS: readonly GameTag[] = [
	GameTag.TAG_SCRIPT_DATA_NUM_1,
	GameTag.TAG_SCRIPT_DATA_NUM_2,
	GameTag.TAG_SCRIPT_DATA_NUM_3,
	GameTag.TAG_SCRIPT_DATA_NUM_4,
	GameTag.TAG_SCRIPT_DATA_NUM_5,
	GameTag.TAG_SCRIPT_DATA_NUM_6,
];

export const getEnchantmentTagValue = (entity: Entity, tag: GameTag): number => {
	// Entity.getTag returns undefined when the tag key is missing (not always -1).
	const value = entity.getTag(tag);
	return typeof value === 'number' && !Number.isNaN(value) && value >= 0 ? value : 0;
};

export const formatEnchantmentText = (text: string | undefined, entity: Entity): string => {
	if (!text) {
		return '';
	}

	let description = text
		.replace('\n', '<br/>')
		.replace(/\u00a0/g, ' ')
		.replace(/^\[x\]/, '');

	// Reference texts often use literal +0/+0 as placeholders (same meaning as +{0}/+{1}).
	// Run before {N} substitution so texts like +{0}/+{1} are left for the brace replacer.
	const scriptAtk = getEnchantmentTagValue(entity, GameTag.TAG_SCRIPT_DATA_NUM_1);
	const scriptHealth = getEnchantmentTagValue(entity, GameTag.TAG_SCRIPT_DATA_NUM_2);
	description = description.replace(/\+(\d+)\/\+(\d+)/g, `+${scriptAtk}/+${scriptHealth}`);

	description = description.replace(/\{(\d+)\}/g, (_, indexStr: string) => {
		const index = +indexStr;
		const tag = SCRIPT_DATA_TAGS[index];
		return tag != null ? `${getEnchantmentTagValue(entity, tag)}` : `{${indexStr}}`;
	});

	description = description.replace('@', `${getEnchantmentTagValue(entity, GameTag.TAG_SCRIPT_DATA_NUM_1)}`);

	return description;
};

export interface GroupedEnchantment {
	readonly entity: Entity;
	readonly count: number;
}

export const groupAndSortEnchantments = (
	enchantments: readonly Entity[] | undefined,
): readonly GroupedEnchantment[] => {
	if (!enchantments?.length) {
		return [];
	}

	const groups = new Map<string, Entity[]>();
	const order: string[] = [];
	for (const enchantment of enchantments) {
		const cardId = enchantment.cardID ?? '';
		if (!groups.has(cardId)) {
			groups.set(cardId, []);
			order.push(cardId);
		}
		groups.get(cardId)!.push(enchantment);
	}

	const grouped: GroupedEnchantment[] = order.map((cardId) => {
		const entities = groups.get(cardId)!;
		return {
			entity: buildGroupedEntity(entities),
			count: entities.length,
		};
	});

	return [...grouped].sort((a, b) => {
		const aPriority = a.entity.cardID?.includes('MidGameEffect') ? 0 : 1;
		const bPriority = b.entity.cardID?.includes('MidGameEffect') ? 0 : 1;
		return aPriority - bPriority;
	});
};

const buildGroupedEntity = (entities: readonly Entity[]): Entity => {
	const first = entities[0];
	if (entities.length === 1) {
		return first;
	}

	const sumTag = (tag: GameTag): number =>
		entities.reduce((sum, entity) => sum + getEnchantmentTagValue(entity, tag), 0);

	return Entity.create(first, {
		tags: {
			...first.tags,
			[GameTag[GameTag.ATK]]: sumTag(GameTag.ATK),
			[GameTag[GameTag.HEALTH]]: sumTag(GameTag.HEALTH),
			[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_1]]: sumTag(GameTag.TAG_SCRIPT_DATA_NUM_1),
			[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_2]]: sumTag(GameTag.TAG_SCRIPT_DATA_NUM_2),
		},
	});
};
