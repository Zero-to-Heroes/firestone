/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	BUDDIES_TRIBE_REQUIREMENTS,
	CardIds,
	CardRules,
	CardType,
	CustomTags,
	GameTag,
	getBuddy,
	NON_DISCOVERABLE_BUDDIES,
	Race,
	ReferenceCard,
	SpellSchool,
} from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { isBgsTimewarped } from '../card-utils';
import { ExtendedReferenceCard, TavernTierType, Tier, TierGroup } from '../tiers.model';
import { buildTierForTavernTier } from './standard-tiers-builder';
import { TierBuilderConfig } from './tiers-config.model';
import { buildSingleTribeTier } from './tribe-tiers-builder';
import { getTrinketNameKey } from './utils';

const MAIN_MECHANICS_IN_GAME = [
	{ mechanic: GameTag.BATTLECRY, tierId: 'B' },
	{ mechanic: GameTag.DEATHRATTLE, tierId: 'D' },
	{ mechanic: GameTag.END_OF_TURN, tierId: 'E' },
	{ mechanic: GameTag.BACON_RALLY, tierId: 'Ra' },
];

export const MECHANICS_IN_GAME: readonly { mechanic: GameTag; tierId: string; canBeHighlighted?: boolean }[] = [
	...MAIN_MECHANICS_IN_GAME,
	{ mechanic: GameTag.DIVINE_SHIELD, tierId: 'DS' },
	{ mechanic: GameTag.TAUNT, tierId: 'T' },
	{ mechanic: GameTag.REBORN, tierId: 'Re' },
	{ mechanic: GameTag.CHOOSE_ONE, tierId: 'C' },
	{ mechanic: GameTag.MODULAR, tierId: 'M' },
	{ mechanic: GameTag.BACON_BUFFS_TAVERN_SPELL, tierId: 'TS' },
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
	heroPowerCardId: string,
	allPlayerCardIds: readonly string[],
	allCards: CardsFacadeService,
	cardRules: CardRules,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): readonly Tier[] => {
	const allBuddies = buildBuddies(availableTribes, heroPowerCardId, allPlayerCardIds, allCards, config);
	let mechanicsInGame = config?.showAllMechanics ? [...MECHANICS_IN_GAME] : MAIN_MECHANICS_IN_GAME;
	if (!config?.spells) {
		mechanicsInGame = mechanicsInGame.filter((mechanic) => mechanic.mechanic !== GameTag.BG_SPELL);
	}
	if (allBuddies.length === 0) {
		mechanicsInGame = mechanicsInGame.filter((mechanic) => mechanic.mechanic !== GameTag.BACON_BUDDY);
	}
	const result: Tier[] = mechanicsInGame.map((mechanics) =>
		buildTier(mechanics.tierId, mechanics.mechanic, cardsToInclude, allBuddies, tiersToInclude, i18n, config),
	);
	if (config?.showSingleTier) {
		const singleTier = buildSingleTier(cardsToInclude, tiersToInclude, availableTribes, cardRules, i18n, config);
		result.push(singleTier);
	}
	return result.filter((t) => t?.groups?.length);
};

const buildSingleTier = (
	cardsToInclude: readonly ExtendedReferenceCard[],
	tiersToInclude: readonly number[],
	availableTribes: readonly Race[],
	cardRules: CardRules,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	config?: TierBuilderConfig,
): Tier => {
	const tier =
		config?.singleTierGroup === 'tier'
			? buildSingleTribeTier(null, cardsToInclude, tiersToInclude, cardRules, i18n, config)
			: buildTierForTavernTier(cardsToInclude, 0, availableTribes, i18n, config);
	const result: Tier = {
		...tier,
		tavernTier: 'single',
		type: 'mechanics',
		tavernTierIcon: `assets/svg/search.svg`,
		tooltip: 'Searchable tier with all the cards in the lobby',
		showSearchBar: true,
	};
	return result;
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
	const timewarpedGroups = config?.timewarped ? buildTimewarpedGroups(cardsForMechanics, i18n) : [];

	const groups: readonly (TierGroup | null)[] = config?.showSpellsAtBottom
		? [...tierGroups, spellGroup, trinketGroup, ...timewarpedGroups]
		: [spellGroup, trinketGroup, ...tierGroups, ...timewarpedGroups];
	return groups.filter((g) => !!g?.cards?.length) as readonly TierGroup[];
};

const buildTimewarpedGroups = (
	cardsForMechanics: readonly ReferenceCard[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): readonly TierGroup[] => {
	const minorTimewarpCards = cardsForMechanics.filter((card) => card.techLevel === 3 && isBgsTimewarped(card));
	const minorTimewarpGroup: TierGroup = {
		label: i18n.translateString(`app.battlegrounds.tier-list.minor-timewarped-tier`),
		cards: minorTimewarpCards,
		tribe: null,
		tier: null,
	};
	const majorTimewarpCards = cardsForMechanics.filter((card) => card.techLevel === 5 && isBgsTimewarped(card));
	const majorTimewarpGroup: TierGroup = {
		label: i18n.translateString(`app.battlegrounds.tier-list.major-timewarped-tier`),
		cards: majorTimewarpCards,
		tribe: null,
		tier: null,
	};
	return [minorTimewarpGroup, majorTimewarpGroup];
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
		tier: null,
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
		tier: null,
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
			.filter((card) => !isBgsTimewarped(card))
			// .filter((card) => card.type?.toUpperCase() === CardType[CardType.MINION])
			.filter((card) => card.techLevel === techLevel);
		const result: TierGroup = {
			label: i18n.translateString(`app.battlegrounds.tier-list.tier`, { value: techLevel }),
			cards: cards,
			tribe: null,
			tier: techLevel,
		};
		return result;
	}
};

const buildBuddies = (
	availableTribes: readonly Race[],
	heroPowerCardId: string,
	allPlayerCardIds: readonly string[],
	allCards: CardsFacadeService,
	config?: TierBuilderConfig,
) => {
	const allBuddies = allCards
		.getCards()
		.filter((card) => card.mechanics?.includes(GameTag[GameTag.BACON_BUDDY]))
		.filter((card) => !card.otherTags?.includes(CustomTags[CustomTags.REMOVED_FROM_BACON_POOL]))
		.filter((c) => !!c.battlegroundsPremiumDbfId)
		.filter((card) => card.set !== 'Vanilla');
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
							allPlayerBuddiesCardIds.includes(b.id) ||
							!NON_DISCOVERABLE_BUDDIES.includes(b.id as CardIds),
					)
					.filter(
						(b) =>
							!BUDDIES_TRIBE_REQUIREMENTS.find((req) => b.id === req.buddy) ||
							availableTribes.includes(
								BUDDIES_TRIBE_REQUIREMENTS.find((req) => b.id === req.buddy)?.tribe ?? Race.INVALID,
							),
					)
			: // For tess, only show the buddies of the opponents
				[CardIds.BobsBurgles, CardIds.ScabbsCutterbutter_ISpy].includes(heroPowerCardId as CardIds)
				? allPlayerBuddies
				: [];
	return buddies;
};

const isInMechanicalTier = (card: ReferenceCard, mechanic: GameTag): boolean =>
	!!card.mechanics?.includes(GameTag[mechanic]) || !!card.referencedTags?.includes(GameTag[mechanic]);
