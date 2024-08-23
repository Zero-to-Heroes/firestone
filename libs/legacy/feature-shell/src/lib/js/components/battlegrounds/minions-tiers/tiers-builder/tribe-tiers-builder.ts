import {
	CardIds,
	CardType,
	getTribeIcon,
	getTribeName,
	Race,
	ReferenceCard,
	SpellSchool,
} from '@firestone-hs/reference-data';
import { ExtendedReferenceCard, Tier, TierGroup } from '../tiers.model';
import { TierBuilderConfig } from './tiers-config.model';
import { getActualTribes } from './utils';

export const buildTribeTiers = (
	cardsToInclude: readonly ExtendedReferenceCard[],
	tiersToInclude: readonly number[],
	availableTribes: readonly Race[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): readonly Tier[] => {
	const tribeTiers: readonly Tier[] = availableTribes
		.map((targetTribe) => buildSingleTribeTier(targetTribe, cardsToInclude, tiersToInclude, i18n, config))
		.sort((a, b) => a.tooltip.localeCompare(b.tooltip));
	const spellTier: Tier = config?.spells ? buildSpellsTier(cardsToInclude, tiersToInclude, i18n, config) : null;
	const trinketTier: Tier = config?.trinkets ? buildTrinketsTier(cardsToInclude, i18n, config) : null;
	const result: readonly Tier[] = [...tribeTiers, spellTier, trinketTier].filter((tier) => !!tier?.groups?.length);
	return result;
};

const buildTrinketsTier = (
	cardsToInclude: readonly ExtendedReferenceCard[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): Tier => {
	const cardsForTrinkets = cardsToInclude.filter(
		(card) => card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET] && !!card.spellSchool,
	);
	const trinketGroups: readonly TierGroup[] = buildTrinketTierGroups(cardsForTrinkets, i18n, config);
	const result: Tier = {
		type: 'tribe',
		tavernTier: 'trinket',
		tavernTierIcon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.JarOGems_BG30_MagicItem_546}.jpg`,
		tooltip: 'Trinkets',
		groups: trinketGroups.filter((g) => !!g?.cards?.length),
	};
	return result;
};

const buildTrinketTierGroups = (
	cards: readonly ExtendedReferenceCard[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): readonly TierGroup[] => {
	return [SpellSchool.LESSER_TRINKET, SpellSchool.GREATER_TRINKET]
		.map((quality) => {
			const group: TierGroup = buildTrinketTierGroup(cards, quality, i18n, config);
			return group;
		})
		.sort((a, b) => a.label.localeCompare(b.label));
};

const buildTrinketTierGroup = (
	cards: readonly ExtendedReferenceCard[],
	quality: SpellSchool,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): TierGroup => {
	const cardForGroup = cards
		.filter((card) => card.spellSchool?.toUpperCase() === SpellSchool[quality])
		.sort((a, b) => a.name.localeCompare(b.name));
	const result: TierGroup = {
		label: i18n.translateString(
			`app.battlegrounds.filters.trinket-type.${quality === SpellSchool.LESSER_TRINKET ? 'lesser' : 'greater'}`,
		),
		cards: cardForGroup,
		tribe: null,
	};
	return result;
};

const buildSpellsTier = (
	cardsToInclude: readonly ExtendedReferenceCard[],
	tiersToInclude: readonly number[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): Tier => {
	const cardsForSpells = cardsToInclude.filter(
		(card) => card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL],
	);
	const spellGroups: readonly TierGroup[] = buildTierGroups(cardsForSpells, tiersToInclude, i18n, config);
	const result: Tier = {
		type: 'tribe',
		tavernTier: 'spells',
		tavernTierIcon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.CarefulInvestment_BG28_800}.jpg`,
		tooltip: 'Spells',
		groups: spellGroups.filter((g) => !!g?.cards?.length),
	};
	return result;
};

const buildSingleTribeTier = (
	targetTribe: Race,
	cardsToInclude: readonly ExtendedReferenceCard[],
	tiersToInclude: readonly number[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): Tier => {
	const cardsForTribe = cardsToInclude.filter((card) => {
		// TODO: add trinkets here
		const cardTribes: readonly Race[] = getActualTribes(
			card,
			config?.groupMinionsIntoTheirTribeGroup,
			config?.playerTrinkets,
		);
		if (targetTribe === null) {
			return cardTribes.length === 0;
		}
		if (cardTribes.length === 0) {
			return false;
		}
		return cardTribes.includes(Race.ALL) || cardTribes.includes(targetTribe);
	});
	const tribeGroups: readonly TierGroup[] = buildTierGroups(cardsForTribe, tiersToInclude, i18n, config);
	const spellGroup: TierGroup = config?.spells ? buildSpellGroup(cardsForTribe, i18n) : null;
	const trinketGroup = config?.trinkets ? buildTrinketGroup(cardsForTribe, i18n) : null;
	const groups: readonly TierGroup[] = config?.showSpellsAtBottom
		? [...tribeGroups, spellGroup, trinketGroup]
		: [spellGroup, trinketGroup, ...tribeGroups];
	const result: Tier = {
		type: 'tribe',
		tavernTier: Race[targetTribe].toLowerCase(),
		tavernTierIcon: getTribeIcon(targetTribe),
		tooltip: getTribeName(targetTribe, i18n),
		groups: groups.filter((g) => !!g?.cards?.length),
	};
	return result;
};

const buildTrinketGroup = (
	cardsForTribe: readonly ReferenceCard[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): TierGroup => {
	const cardForGroup = cardsForTribe
		.filter((card) => card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET])
		.map((card) => ({
			...card,
			name: i18n.translateString(`battlegrounds.in-game.minions-list`, {
				name: card.name,
			}),
		}));
	const result: TierGroup = {
		label: i18n.translateString(`battlegrounds.in-game.opponents.trinkets-title`),
		cards: cardForGroup,
		tribe: null,
	};
	return result;
};

const buildSpellGroup = (
	cardsForTribe: readonly ExtendedReferenceCard[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): TierGroup => {
	const cardForGroup = cardsForTribe
		.filter((card) => card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL])
		.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name));
	const result: TierGroup = {
		label: i18n.translateString(`global.tribe.spell`),
		cards: cardForGroup,
		tribe: null,
	};
	return result;
};

const buildTierGroups = (
	cards: readonly ExtendedReferenceCard[],
	tiersToInclude: readonly number[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): readonly TierGroup[] => {
	return tiersToInclude
		.map((techLevel) => {
			const group: TierGroup = buildTierGroup(cards, techLevel, i18n, config);
			return group;
		})
		.sort((a, b) => a.label.localeCompare(b.label));
};

const buildTierGroup = (
	cards: readonly ExtendedReferenceCard[],
	techLevel: number,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): TierGroup => {
	const cardForGroup = cards
		.filter((card) => card.techLevel === techLevel)
		.sort((a, b) => a.name.localeCompare(b.name));
	const result: TierGroup = {
		label: i18n.translateString(`app.battlegrounds.tier-list.tier`, { value: techLevel }),
		cards: cardForGroup,
		tribe: null,
	};
	return result;
};
