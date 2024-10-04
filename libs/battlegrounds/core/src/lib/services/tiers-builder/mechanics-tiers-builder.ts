/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	BUDDIES_TRIBE_REQUIREMENTS,
	CardIds,
	CardType,
	GameTag,
	getBuddy,
	NON_DISCOVERABLE_BUDDIES,
	Race,
	ReferenceCard,
	SpellSchool,
} from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { ExtendedReferenceCard, TavernTierType, Tier, TierGroup } from '../tiers.model';
import { TierBuilderConfig } from './tiers-config.model';
import { getTrinketNameKey } from './utils';

export const buildMechanicsTiers = (
	cardsToInclude: readonly ExtendedReferenceCard[],
	tiersToInclude: readonly number[],
	availableTribes: readonly Race[],
	playerCardId: string,
	allPlayerCardIds: readonly string[],
	allCards: CardsFacadeService,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): readonly Tier[] => {
	const allBuddies = buildBuddies(availableTribes, playerCardId, allPlayerCardIds, allCards, config);
	const result: Tier[] = [
		buildTier(
			'B',
			cardsToInclude.filter((c) => isInMechanicalTier(c, GameTag.BATTLECRY)),
			i18n.translateString(`global.mechanics.${GameTag[GameTag.BATTLECRY].toLowerCase()}`),
			tiersToInclude,
			i18n,
			config,
		),
		buildTier(
			'D',
			cardsToInclude.filter((c) => isInMechanicalTier(c, GameTag.DEATHRATTLE)),
			i18n.translateString(`global.mechanics.${GameTag[GameTag.DEATHRATTLE].toLowerCase()}`),
			tiersToInclude,
			i18n,
			config,
		),
		buildTier(
			'DS',
			cardsToInclude.filter((c) => isInMechanicalTier(c, GameTag.DIVINE_SHIELD)),
			i18n.translateString(`global.mechanics.${GameTag[GameTag.DIVINE_SHIELD].toLowerCase()}`),
			tiersToInclude,
			i18n,
			config,
		),
		buildTier(
			'T',
			cardsToInclude.filter((c) => isInMechanicalTier(c, GameTag.TAUNT)),
			i18n.translateString(`global.mechanics.${GameTag[GameTag.TAUNT].toLowerCase()}`),
			tiersToInclude,
			i18n,
			config,
		),
		buildTier(
			'E',
			cardsToInclude.filter((c) => isInMechanicalTier(c, GameTag.END_OF_TURN)),
			i18n.translateString(`global.mechanics.${GameTag[GameTag.END_OF_TURN].toLowerCase()}`),
			tiersToInclude,
			i18n,
			config,
		),
		buildTier(
			'R',
			cardsToInclude.filter((c) => isInMechanicalTier(c, GameTag.REBORN)),
			i18n.translateString(`global.mechanics.${GameTag[GameTag.REBORN].toLowerCase()}`),
			tiersToInclude,
			i18n,
			config,
		),
	];
	if (config?.spells) {
		result.push(
			buildTier(
				'S',
				cardsToInclude.filter((c) => isInMechanicalTier(c, GameTag.BG_SPELL)),
				i18n.translateString(`global.mechanics.${GameTag[GameTag.BG_SPELL].toLowerCase()}`),
				tiersToInclude,
				i18n,
				config,
			),
		);
	}
	if (allBuddies.length > 0) {
		result.push(
			buildTier(
				'Buds',
				allBuddies,
				i18n.translateString('battlegrounds.in-game.minions-list.buddies-tier-tooltip'),
				tiersToInclude,
				i18n,
				config,
			),
		);
	}
	return result.filter((t) => t?.groups?.length);
};

const buildTier = (
	tavernTier: TavernTierType,
	cardsForMechanics: readonly ReferenceCard[],
	label: string,
	tiersToInclude: readonly number[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): Tier => {
	const groups: readonly TierGroup[] = buildGroups(cardsForMechanics, tiersToInclude, i18n, config);
	const result: Tier = {
		type: 'mechanics',
		tavernTier: tavernTier,
		tavernTierIcon: null,
		tooltip: i18n.translateString('battlegrounds.in-game.minions-list.mechanics-tier-tooltip', {
			value: label,
		}),
		groups: groups?.filter((g) => !!g?.cards?.length),
	};
	return result;
};

const buildGroups = (
	cardsForMechanics: readonly ReferenceCard[],
	tiersToInclude: readonly number[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): readonly TierGroup[] => {
	const tierGroups = tiersToInclude.map((techLevel) => buildTierGroup(cardsForMechanics, techLevel, i18n, config));
	const spellGroup = config?.spells ? buildSpellGroup(cardsForMechanics, i18n) : null;
	const trinketGroup = config?.trinkets ? buildTrinketGroup(cardsForMechanics, i18n) : null;

	const groups: readonly (TierGroup | null)[] = config?.showSpellsAtBottom
		? [...tierGroups, spellGroup, trinketGroup]
		: [spellGroup, trinketGroup, ...tierGroups];
	return groups.filter((g) => !!g?.cards?.length) as readonly TierGroup[];
};

const buildTrinketGroup = (
	cardsForMechanics: readonly ReferenceCard[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): TierGroup => {
	const cardForGroup = cardsForMechanics
		.filter((card) => card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET])
		.sort((a, b) => SpellSchool[a.spellSchool!] - SpellSchool[b.spellSchool!] || a.name.localeCompare(b.name))
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
	cardsForMechanics: readonly ReferenceCard[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): TierGroup => {
	const cardForGroup = cardsForMechanics
		.filter((card) => card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL])
		.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name));
	const result: TierGroup = {
		label: i18n.translateString(`global.tribe.spell`),
		cards: cardForGroup,
		tribe: null,
	};
	return result;
};

const buildTierGroup = (
	cardsForMechanics: readonly ReferenceCard[],
	techLevel: number,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): TierGroup => {
	{
		const cards = cardsForMechanics
			.filter((card) => card.type?.toUpperCase() === CardType[CardType.MINION])
			.filter((card) => card.techLevel === techLevel);
		const result: TierGroup = {
			label: i18n.translateString(`app.battlegrounds.tier-list.tier`, { value: techLevel }),
			cards: cards,
			tribe: null,
		};
		return result;
	}
};

const buildBuddies = (
	availableTribes: readonly Race[],
	playerCardId: string,
	allPlayerCardIds: readonly string[],
	allCards: CardsFacadeService,
	config?: TierBuilderConfig,
) => {
	const allBuddies = allCards
		.getCards()
		.filter((c) => !!c.techLevel)
		.filter((c) => !!c.battlegroundsPremiumDbfId)
		.filter((card) => card.set !== 'Vanilla')
		.filter((card) => card.mechanics?.includes(GameTag[GameTag.BACON_BUDDY]));
	const allPlayerBuddies = allPlayerCardIds
		.map((p) => getBuddy(p as CardIds, allCards.getService()))
		.map((b) => allCards.getCard(b!));
	const allPlayerBuddiesCardIds = allPlayerBuddies.map((b) => b.id);
	const buddies: readonly ReferenceCard[] = !config?.showBuddiesTier
		? []
		: config?.showAllBuddyCards
		? allBuddies
				.filter(
					(b) =>
						allPlayerBuddiesCardIds.includes(b.id) || !NON_DISCOVERABLE_BUDDIES.includes(b.id as CardIds),
				)
				.filter(
					(b) =>
						!BUDDIES_TRIBE_REQUIREMENTS.find((req) => b.id === req.buddy) ||
						availableTribes.includes(
							BUDDIES_TRIBE_REQUIREMENTS.find((req) => b.id === req.buddy)?.tribe ?? Race.INVALID,
						),
				)
		: // For tess, only show the buddies of the opponents
		[CardIds.TessGreymane_TB_BaconShop_HERO_50, CardIds.ScabbsCutterbutter_BG21_HERO_010].includes(
				playerCardId as CardIds,
		  )
		? allPlayerBuddies
		: [];
	return buddies;
};

const isInMechanicalTier = (card: ReferenceCard, mechanic: GameTag): boolean =>
	!!card.mechanics?.includes(GameTag[mechanic]) || !!card.referencedTags?.includes(GameTag[mechanic]);
