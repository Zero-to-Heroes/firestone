import { CardType, Race } from '@firestone-hs/reference-data';
import { ExtendedReferenceCard, Tier, TierGroup } from '../tiers.model';
import { compareTribes, getActualTribes } from '../tribe-utils';
import { TierBuilderConfig } from './tiers-config.model';

export const buildStandardTiers = (
	cardsToInclude: readonly ExtendedReferenceCard[],
	tiersToInclude: readonly number[],
	availableTribes: readonly Race[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): readonly Tier[] => {
	const result: readonly Tier[] = tiersToInclude.map((techLevel) => {
		const cardsForTier = cardsToInclude.filter((card) => card.techLevel === techLevel);
		const tier = buildTier(cardsForTier, techLevel, availableTribes, i18n, config);
		return tier;
	});
	return result;
};

const buildTier = (
	cardsForTier: readonly ExtendedReferenceCard[],
	tier: number,
	availableTribes: readonly Race[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): Tier => {
	const tribeGroups: readonly TierGroup[] = buildTribeGroups(cardsForTier, availableTribes, i18n, config);
	const spellGroup: TierGroup | null = config?.spells ? buildSpellGroup(cardsForTier, i18n) : null;
	const groups: readonly (TierGroup | null)[] = config?.showSpellsAtBottom
		? [...tribeGroups, spellGroup]
		: [spellGroup, ...tribeGroups];
	const result: Tier = {
		type: 'standard',
		tavernTier: tier,
		// tavernTierIcon: null,
		tavernTierIcon: `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/tavern_banner_${tier}.png`,
		tooltip: i18n.translateString(`app.battlegrounds.tier-list.tier`, { value: tier }),
		groups: groups.filter((g) => !!g?.cards?.length) as readonly TierGroup[],
	};
	return result;
};

const buildSpellGroup = (
	cardsForTier: readonly ExtendedReferenceCard[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): TierGroup => {
	const cardForGroup = cardsForTier
		.filter((card) => card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL])
		.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name));
	const result: TierGroup = {
		label: i18n.translateString(`global.tribe.spell`),
		cards: cardForGroup,
		tribe: null,
	};
	return result;
};

const buildTribeGroups = (
	cards: readonly ExtendedReferenceCard[],
	availableTribes: readonly Race[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): readonly TierGroup[] => {
	const minions = cards.filter((card) => card.type?.toUpperCase() === CardType[CardType.MINION]);
	return [...availableTribes, Race.ALL, null]
		.map((tribe) => {
			const group: TierGroup = buildTribeGroup(minions, tribe, i18n, config);
			return group;
		})
		.sort((a, b) => {
			return compareTribes(a.tribe, b.tribe, i18n);
		});
};

const buildTribeGroup = (
	cards: readonly ExtendedReferenceCard[],
	targetTribe: Race | null,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): TierGroup => {
	const cardForGroup = cards
		.filter((card) => {
			const cardTribes: readonly Race[] = getActualTribes(
				card,
				config?.groupMinionsIntoTheirTribeGroup ?? false,
				config?.playerTrinkets,
				config?.anomalies,
			);
			if (targetTribe === null) {
				return cardTribes.length === 0 || cardTribes.includes(Race.BLANK);
			}
			if (cardTribes.length === 0) {
				return false;
			}
			return cardTribes.includes(targetTribe);
		})
		.sort((a, b) => a.name.localeCompare(b.name));
	const result: TierGroup = {
		label: i18n.translateString(
			`global.tribe.${(!targetTribe ? Race[Race.BLANK] : Race[targetTribe]).toLowerCase()}`,
		),
		cards: cardForGroup,
		tribe: targetTribe ?? Race.BLANK,
	};
	return result;
};
