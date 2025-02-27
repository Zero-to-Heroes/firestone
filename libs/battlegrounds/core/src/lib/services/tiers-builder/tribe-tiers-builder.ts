/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	CardIds,
	CardRules,
	CardType,
	GameTag,
	getTribeIcon,
	getTribeName,
	Race,
	ReferenceCard,
	SpellSchool,
} from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { isBgsSpell } from '../card-utils';
import { ExtendedReferenceCard, Tier, TierGroup } from '../tiers.model';
import { getActualTribes } from '../tribe-utils';
import { TierBuilderConfig } from './tiers-config.model';
import { getTrinketNameKey } from './utils';

export const buildTribeTiers = (
	cardsToInclude: readonly ExtendedReferenceCard[],
	tiersToInclude: readonly number[],
	availableTribes: readonly Race[],
	cardRules: CardRules,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	allCards: CardsFacadeService,
	config?: TierBuilderConfig,
): readonly Tier[] => {
	const allTribes = [...availableTribes, Race.BLANK];
	const standardTribeTiers: readonly Tier[] = allTribes.map((targetTribe) =>
		buildSingleTribeTier(targetTribe, cardsToInclude, tiersToInclude, cardRules, i18n, config),
	);

	const scCards = allCards
		.getCards()
		.filter(
			(c) =>
				c.set === 'Battlegrounds' &&
				!c.premium &&
				([CardType[CardType.MINION], CardType[CardType.BATTLEGROUND_SPELL]].includes(c.type?.toUpperCase()) ||
					c.spellSchool === SpellSchool[SpellSchool.UPGRADE]),
		);
	const types: { type: 'Zerg' | 'Protoss' | 'Battlecruiser'; inclusion: (card: ExtendedReferenceCard) => boolean }[] =
		[];
	if (config?.showProtossMinions) {
		types.push({
			type: 'Protoss',
			inclusion: (card: ExtendedReferenceCard) => card.mechanics?.includes(GameTag[GameTag.PROTOSS]),
		});
	}
	if (config?.showZergMinions) {
		types.push({
			type: 'Zerg',
			inclusion: (card: ExtendedReferenceCard) => card.mechanics?.includes(GameTag[GameTag.ZERG]),
		});
	}
	if (config?.showBattlecruiserUpgrades) {
		types.push({
			type: 'Battlecruiser',
			inclusion: (card: ExtendedReferenceCard) => card.spellSchool === SpellSchool[SpellSchool.UPGRADE],
		});
	}
	const scTribeTiers: readonly Tier[] = types.map((type) =>
		buildSingleScTribeTier(type.type, type.inclusion, scCards, tiersToInclude, cardRules, i18n, config),
	);
	// console.debug('scTribeTiers', scTribeTiers, scTribes, config, scCards);

	const tribeTiers = [
		...[...standardTribeTiers].sort((a, b) =>
			a.tavernTierData === Race.BLANK
				? 1
				: b.tavernTierData === Race.BLANK
				? -1
				: a.tooltip.localeCompare(b.tooltip),
		),
		...scTribeTiers,
	].filter((t) => !!t);
	const spellTier: Tier | null = config?.spells
		? buildSpellsTier(cardsToInclude, tiersToInclude, i18n, config)
		: null;
	const trinketTier: Tier | null = config?.trinkets ? buildTrinketsTier(cardsToInclude, i18n, config) : null;
	const result: readonly Tier[] = [...tribeTiers, spellTier, trinketTier].filter(
		(tier) => !!tier?.groups?.length,
	) as readonly Tier[];
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
		tooltip: i18n.translateString('battlegrounds.in-game.opponents.trinkets-title'),
		groups: trinketGroups.filter((g) => !!g?.cards?.length),
	};
	return result;
};

const buildTrinketTierGroups = (
	cards: readonly ExtendedReferenceCard[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): readonly TierGroup[] => {
	return [SpellSchool.LESSER_TRINKET, SpellSchool.GREATER_TRINKET].map((quality) => {
		const group: TierGroup = buildTrinketTierGroup(cards, quality, i18n, config);
		return group;
	});
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
	const spellGroups: readonly TierGroup[] = buildTribeTierGroups(cardsForSpells, tiersToInclude, i18n, config);
	const result: Tier = {
		type: 'tribe',
		tavernTier: 'spells',
		tavernTierIcon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.CarefulInvestment_BG28_800}.jpg`,
		tooltip: i18n.translateString('battlegrounds.in-game.minions-list.spells-tier-tooltip'),
		groups: spellGroups.filter((g) => !!g?.cards?.length),
	};
	return result;
};

const buildSingleScTribeTier = (
	type: 'Protoss' | 'Zerg' | 'Battlecruiser',
	inclusion: (card: ExtendedReferenceCard) => boolean,
	cardsToInclude: readonly ExtendedReferenceCard[],
	tiersToInclude: readonly number[],
	cardRules: CardRules,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): Tier => {
	const cardsForTribe = cardsToInclude.filter((card) => inclusion(card));
	const tribeGroups: readonly TierGroup[] = buildTribeTierGroups(cardsForTribe, tiersToInclude, i18n, config);
	const groups: readonly (TierGroup | null)[] = [...tribeGroups];
	const tribeName = getScTribeName(type, i18n);
	const result: Tier = {
		type: 'tribe',
		tavernTier: type.toLowerCase(),
		tavernTierIcon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${getScTierIcon(type)}.jpg`,
		tavernTierData: type,
		tierName: getScTribeName(type, i18n),
		tooltip: getTribeTooltipForTribeName(tribeName, i18n),
		groups: groups.filter((g) => !!g?.cards?.length) as readonly TierGroup[],
	};
	return result;
};

export const getScTribeName = (
	type: 'Protoss' | 'Zerg' | 'Battlecruiser',
	i18n: { translateString: (input: string) => string },
): string => {
	return i18n.translateString(`app.battlegrounds.tribes.${type?.toLowerCase()}`);
};

const getScTierIcon = (type: 'Protoss' | 'Zerg' | 'Battlecruiser'): string => {
	switch (type) {
		case 'Protoss':
			return CardIds.WarpGate_MothershipToken_BG31_HERO_802pt7;
		case 'Zerg':
			return CardIds.KerriganQueenOfBlades_LarvaToken_BG31_HERO_811t;
		case 'Battlecruiser':
			return CardIds.LiftOff_BattlecruiserToken_BG31_HERO_801pt;
	}
};

const buildSingleTribeTier = (
	targetTribe: Race,
	cardsToInclude: readonly ExtendedReferenceCard[],
	tiersToInclude: readonly number[],
	cardRules: CardRules,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): Tier => {
	const debug = targetTribe === Race.BLANK;
	const cardsForTribe = cardsToInclude.filter((card) => {
		const cardTribes: readonly Race[] = getActualTribes(
			card,
			config?.groupMinionsIntoTheirTribeGroup ?? false,
			config?.playerTrinkets,
			config?.anomalies ?? [],
		);
		// const isTrinket = isBgsTrinket(card);
		const isSpell = isBgsSpell(card);
		const requiredCardTribes = [
			...(cardRules?.[card.id]?.bgsMinionTypesRules?.needTypesInLobby ?? []),
			...(cardRules?.[card.id]?.bgsMinionTypesRules?.needBoardTypes ?? []),
		]
			.filter((type) => type)
			.map((tribe) => Race[tribe]);
		if (targetTribe === null || targetTribe === Race.BLANK) {
			return (
				(!isSpell && cardTribes.filter((t) => t !== Race.BLANK).length === 0) ||
				requiredCardTribes.filter((t) => t !== Race.BLANK).length === 0
			);
		}
		if (cardTribes.length === 0 && requiredCardTribes.length === 0) {
			return false;
		}
		return (
			cardTribes.includes(Race.ALL) ||
			cardTribes.includes(targetTribe) ||
			requiredCardTribes.includes(targetTribe)
		);
	});
	const tribeGroups: readonly TierGroup[] = buildTribeTierGroups(cardsForTribe, tiersToInclude, i18n, config);
	const spellGroup: TierGroup | null =
		config?.spells && targetTribe !== Race.BLANK ? buildSpellGroup(cardsForTribe, i18n) : null;
	const trinketGroup =
		config?.trinkets && config?.includeTrinketsInTribeGroups && targetTribe !== Race.BLANK
			? buildTrinketGroup(cardsForTribe, i18n)
			: null;
	const groups: readonly (TierGroup | null)[] = config?.showSpellsAtBottom
		? [...tribeGroups, spellGroup, trinketGroup]
		: [spellGroup, trinketGroup, ...tribeGroups];
	const tribeName = getTribeName(targetTribe, i18n);
	const result: Tier = {
		type: 'tribe',
		tavernTier: Race[targetTribe].toLowerCase(),
		tavernTierIcon: getTribeIcon(targetTribe),
		tavernTierData: targetTribe,
		tierName: tribeName,
		tooltip: getTribeTooltipForTribeName(tribeName, i18n),
		groups: groups.filter((g) => !!g?.cards?.length) as readonly TierGroup[],
	};
	return result;
};

const getTribeTooltipForTribeName = (
	tribeName: string,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): string => {
	return i18n.translateString('battlegrounds.in-game.minions-list.tribe-category-tooltip', {
		tribeName: tribeName,
	});
};

const buildTrinketGroup = (
	cardsForTribe: readonly ReferenceCard[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): TierGroup => {
	const cardForGroup = cardsForTribe
		.filter((card) => card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET])
		.sort(
			(a, b) =>
				(SpellSchool[a.spellSchool!] ?? 0) - (SpellSchool[b.spellSchool!] ?? 0) || a.name.localeCompare(b.name),
		)
		.map((card) => ({
			...card,
			name: i18n.translateString(`battlegrounds.in-game.minions-list.${getTrinketNameKey(card)}`, {
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

const buildTribeTierGroups = (
	cards: readonly ExtendedReferenceCard[],
	tiersToInclude: readonly number[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): readonly TierGroup[] => {
	return tiersToInclude
		.map((techLevel) => {
			const group: TierGroup = buildTribeTierGroup(cards, techLevel, i18n, config);
			return group;
		})
		.sort((a, b) => (!!a.tribe ? -1 : 0) - (!!b.tribe ? -1 : 0) || a.label.localeCompare(b.label));
};

const buildTribeTierGroup = (
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
