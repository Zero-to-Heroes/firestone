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

export const MECHANICS_IN_GAME = [
	{ mechanic: GameTag.BATTLECRY, tierId: 'B' },
	{ mechanic: GameTag.DEATHRATTLE, tierId: 'D' },
	{ mechanic: GameTag.DIVINE_SHIELD, tierId: 'DS' },
	{ mechanic: GameTag.TAUNT, tierId: 'T' },
	{ mechanic: GameTag.END_OF_TURN, tierId: 'E' },
	{ mechanic: GameTag.REBORN, tierId: 'R' },
	{ mechanic: GameTag.CHOOSE_ONE, tierId: 'C' },
	{ mechanic: GameTag.MODULAR, tierId: 'M' },
	{ mechanic: GameTag.BG_SPELL, tierId: 'S' },
	{
		mechanic: GameTag.BACON_BUDDY,
		tierId: 'Bdy',
		canBeHighlighted: false,
	},
];

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
	let mechanicsInGame = [...MECHANICS_IN_GAME];
	if (!config?.spells) {
		mechanicsInGame = mechanicsInGame.filter((mechanic) => mechanic.mechanic !== GameTag.BG_SPELL);
	}
	if (allBuddies.length === 0) {
		mechanicsInGame = mechanicsInGame.filter((mechanic) => mechanic.mechanic !== GameTag.BACON_BUDDY);
	}
	const result: Tier[] = mechanicsInGame.map((mechanics) =>
		buildTier(mechanics.tierId, mechanics.mechanic, cardsToInclude, allBuddies, tiersToInclude, i18n, config),
	);
	console.debug('[debug] tiers', result);
	return result.filter((t) => t?.groups?.length);
};

const buildTier = (
	tavernTier: TavernTierType,
	gameTag: GameTag,
	cardsToInclude: readonly ReferenceCard[],
	allBuddies: readonly ReferenceCard[],
	tiersToInclude: readonly number[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
	inputLabel?: string,
): Tier => {
	const cardsForMechanics =
		gameTag === GameTag.BACON_BUDDY ? allBuddies : cardsToInclude.filter((c) => isInMechanicalTier(c, gameTag));
	console.debug('[debug] cardsForMechanics', GameTag[gameTag], cardsForMechanics, cardsToInclude);
	const label = inputLabel ?? i18n.translateString(`global.mechanics.${GameTag[gameTag].toLowerCase()}`);
	const groups: readonly TierGroup[] = buildGroups(cardsForMechanics, tiersToInclude, i18n, config);
	const result: Tier = {
		type: 'mechanics',
		tavernTier: tavernTier,
		tavernTierIcon: null,
		tavernTierData: gameTag,
		tierName: i18n.translateString(`global.mechanics.${GameTag[gameTag].toLowerCase()}`),
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
			// .filter((card) => card.type?.toUpperCase() === CardType[CardType.MINION])
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
	console.debug('[debug] allBuddies', allBuddies);
	const allPlayerBuddies = allPlayerCardIds
		.map((p) => getBuddy(p as CardIds, allCards.getService()))
		.map((b) => allCards.getCard(b!));
	console.debug('[debug] allPlayerBuddies', allPlayerBuddies);
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
	console.debug('[debug] buddies', config?.showAllBuddyCards, buddies);
	return buddies;
};

const isInMechanicalTier = (card: ReferenceCard, mechanic: GameTag): boolean =>
	!!card.mechanics?.includes(GameTag[mechanic]) || !!card.referencedTags?.includes(GameTag[mechanic]);
