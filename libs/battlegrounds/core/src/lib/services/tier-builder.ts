/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRules, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { QuestReward } from '../models/quests';
import { filterCardsToInclude } from './tiers-builder/cards-to-include';
import { buildMechanicsTiers } from './tiers-builder/mechanics-tiers-builder';
import { buildStandardTiers } from './tiers-builder/standard-tiers-builder';
import { TierBuilderConfig } from './tiers-builder/tiers-config.model';
import { buildTiersToInclude } from './tiers-builder/tiers-to-include';
import { buildTribeTiers } from './tiers-builder/tribe-tiers-builder';
import { ExtendedReferenceCard, Tier } from './tiers.model';

export const buildTiers = (
	cardsInGame: readonly ReferenceCard[],
	options: BuildTierOptions,
	gameState: BuildTierGameState,
	cardRules: CardRules,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	allCards: CardsFacadeService,
): readonly Tier[] => {
	if (!cardsInGame?.length) {
		return [];
	}

	// Input sanitation
	const anomalies = gameState.anomalies ?? [];
	const availableTribes = gameState.availableTribes ?? [];
	const allPlayerCardIds = gameState.allPlayerCardIds ?? [];

	// Display config
	const showAllBuddyCards =
		gameState.hasBuddies ||
		anomalies.includes(CardIds.BringInTheBuddies_BG27_Anomaly_810) ||
		gameState.heroPowerCardId === CardIds.ETCBandManager_SignANewArtist;
	const showBuddiesTier =
		showAllBuddyCards ||
		(gameState.hasBuddies &&
			[CardIds.BobsBurgles, CardIds.ScabbsCutterbutter_ISpy].includes(gameState.heroPowerCardId as CardIds));

	const tiersToInclude = buildTiersToInclude(
		options.showTierSeven,
		anomalies,
		gameState.heroPowerCardId,
		gameState.playerTrinkets,
		gameState.questRewards,
	);
	const cardsToInclude: readonly ExtendedReferenceCard[] = filterCardsToInclude(
		cardsInGame,
		tiersToInclude,
		anomalies,
		gameState.playerCardId,
		cardRules,
		allCards,
		i18n,
	);

	const showTrinkets =
		(options.showTrinkets && gameState.hasTrinkets) ||
		[CardIds.MarinTheManager_FantasticTreasure_BG30_HERO_304p].includes(gameState.heroPowerCardId as CardIds) ||
		anomalies?.includes(CardIds.MarinsTreasureBox_BG31_Anomaly_106);

	const showSpells = gameState.hasSpells;
	const showTimewarped = gameState.hasTimewarped && options.showTimewarped;

	const config: TierBuilderConfig = {
		showAllMechanics: options.showAllMechanics,
		spells: showSpells,
		trinkets: showTrinkets,
		timewarped: showTimewarped,
		playerTrinkets: gameState.playerTrinkets,
		anomalies: anomalies,
		groupMinionsIntoTheirTribeGroup: options.groupMinionsIntoTheirTribeGroup,
		includeTrinketsInTribeGroups: options.includeTrinketsInTribeGroups,
		showSpellsAtBottom: options.showSpellsAtBottom,
		showAllBuddyCards: showAllBuddyCards,
		showBuddiesTier: showBuddiesTier,
		showProtossMinions: gameState.heroPowerCardId === CardIds.Artanis_WarpGate_BG31_HERO_802p,
		showZergMinions: gameState.heroPowerCardId === CardIds.KerriganQueenOfBlades_SpawningPool_BG31_HERO_811p,
		showBattlecruiserUpgrades:
			gameState.heroPowerCardId === CardIds.JimRaynor_LiftOff_BG31_HERO_801p ||
			gameState.playerTrinkets?.includes(CardIds.BattlecruiserPortrait_BG32_MagicItem_806),
		showSingleTier: options.showSingleTier,
		singleTierGroup: options.singleTierGroup,
	};
	const standardTiers: readonly Tier[] = buildStandardTiers(
		cardsToInclude,
		tiersToInclude,
		availableTribes,
		cardRules,
		i18n,
		config,
	);
	const mechanicsTiers: readonly Tier[] = options.showMechanicsTiers
		? buildMechanicsTiers(
				cardsToInclude,
				tiersToInclude,
				availableTribes,
				gameState.heroPowerCardId,
				allPlayerCardIds,
				allCards,
				cardRules,
				i18n,
				config,
			)
		: [];
	const tribeTiers: readonly Tier[] = options.showTribeTiers
		? buildTribeTiers(cardsToInclude, tiersToInclude, availableTribes, cardRules, i18n, allCards, config)
		: [];
	return [...standardTiers, ...mechanicsTiers, ...tribeTiers];
};

export interface BuildTierOptions {
	showAllMechanics: boolean;
	groupMinionsIntoTheirTribeGroup: boolean;
	includeTrinketsInTribeGroups: boolean;
	showMechanicsTiers: boolean;
	showTribeTiers: boolean;
	showTimewarped: boolean;
	showTierSeven: boolean;
	showTrinkets: boolean;
	showSpellsAtBottom: boolean;
	showSingleTier: boolean;
	singleTierGroup: 'tier' | 'tribe';
}
export interface BuildTierGameState {
	playerCardId: string;
	heroPowerCardId: string;
	availableTribes: readonly Race[];
	anomalies: readonly string[];
	allPlayerCardIds: readonly string[];
	playerTrinkets: readonly string[];
	questRewards: readonly QuestReward[];
	hasBuddies: boolean;
	hasSpells: boolean;
	hasTimewarped: boolean;
	hasTrinkets: boolean;
}
