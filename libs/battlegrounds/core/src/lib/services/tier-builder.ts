/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRules, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { filterCardsToInclude } from './tiers-builder/cards-to-include';
import { buildMechanicsTiers } from './tiers-builder/mechanics-tiers-builder';
import { buildStandardTiers } from './tiers-builder/standard-tiers-builder';
import { TierBuilderConfig } from './tiers-builder/tiers-config.model';
import { buildTiersToInclude } from './tiers-builder/tiers-to-include';
import { buildTribeTiers } from './tiers-builder/tribe-tiers-builder';
import { ExtendedReferenceCard, Tier } from './tiers.model';

export const buildTiers = (
	cardsInGame: readonly ReferenceCard[],
	groupMinionsIntoTheirTribeGroup: boolean,
	includeTrinketsInTribeGroups: boolean,
	showMechanicsTiers: boolean,
	showTribeTiers: boolean,
	showTierSeven: boolean,
	showTrinketsInput: boolean,
	availableTribes: readonly Race[],
	anomalies: readonly string[],
	playerCardId: string,
	allPlayerCardIds: readonly string[],
	hasBuddies: boolean,
	hasSpells: boolean,
	showSpellsAtBottom: boolean,
	hasTrinkets: boolean,
	playerTrinkets: readonly string[],
	cardRules: CardRules,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	allCards: CardsFacadeService,
): readonly Tier[] => {
	if (!cardsInGame?.length) {
		return [];
	}

	// Input sanitation
	anomalies = anomalies ?? [];
	availableTribes = availableTribes ?? [];
	allPlayerCardIds = allPlayerCardIds ?? [];

	// Display config
	const showAllBuddyCards =
		hasBuddies ||
		anomalies.includes(CardIds.BringInTheBuddies_BG27_Anomaly_810) ||
		playerCardId === CardIds.ETCBandManager_BG25_HERO_105;
	const showBuddiesTier =
		showAllBuddyCards ||
		(hasBuddies &&
			[CardIds.TessGreymane_TB_BaconShop_HERO_50, CardIds.ScabbsCutterbutter_BG21_HERO_010].includes(
				playerCardId as CardIds,
			));

	const tiersToInclude = buildTiersToInclude(showTierSeven, anomalies, playerCardId, playerTrinkets);
	const cardsToInclude: readonly ExtendedReferenceCard[] = filterCardsToInclude(
		cardsInGame,
		tiersToInclude,
		anomalies,
		playerCardId,
		cardRules,
		allCards,
		i18n,
	);

	const showTrinkets =
		(showTrinketsInput && hasTrinkets) || [CardIds.MarinTheManager_BG30_HERO_304].includes(playerCardId as CardIds);

	const config: TierBuilderConfig = {
		spells: hasSpells,
		trinkets: showTrinkets,
		playerTrinkets: playerTrinkets,
		anomalies: anomalies,
		groupMinionsIntoTheirTribeGroup: groupMinionsIntoTheirTribeGroup,
		includeTrinketsInTribeGroups: includeTrinketsInTribeGroups,
		showSpellsAtBottom: showSpellsAtBottom,
		showAllBuddyCards: showAllBuddyCards,
		showBuddiesTier: showBuddiesTier,
		showProtossMinions: true, //playerCardId === CardIds.JimRaynor_BG31_HERO_801,
		showZergMinions: true, //playerCardId === CardIds.KerriganQueenOfBlades_BG31_HERO_811,
	};
	const standardTiers: readonly Tier[] = buildStandardTiers(
		cardsToInclude,
		tiersToInclude,
		availableTribes,
		i18n,
		config,
	);
	const mechanicsTiers: readonly Tier[] = showMechanicsTiers
		? buildMechanicsTiers(
				cardsToInclude,
				tiersToInclude,
				availableTribes,
				playerCardId,
				allPlayerCardIds,
				allCards,
				i18n,
				config,
		  )
		: [];
	const tribeTiers: readonly Tier[] = showTribeTiers
		? buildTribeTiers(cardsToInclude, tiersToInclude, availableTribes, cardRules, i18n, allCards, config)
		: [];
	return [...standardTiers, ...mechanicsTiers, ...tribeTiers];
};
