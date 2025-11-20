/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import {
	AllCardsService,
	arenaSets,
	brawlSets,
	CardClass,
	CardIds,
	CardRarity,
	CardType,
	CREWMATES,
	DkruneTypes,
	GameFormat,
	GameTag,
	GameType,
	hasCorrectTribe,
	hasMechanic,
	hasSpellSchool,
	isArena,
	isValidSet,
	Race,
	ReferenceCard,
	SetId,
	SpellSchool,
} from '@firestone-hs/reference-data';

import { DeckState } from '../models/deck-state';
import { PlayerGameState } from '../models/full-game-state';
import { GameState } from '../models/game-state';

const IMBUED_HERO_POWERS = [
	CardIds.BlessingOfTheDragon_EDR_445p,
	CardIds.BlessingOfTheWolf_EDR_850p,
	CardIds.BlessingOfTheWind_EDR_448p,
	CardIds.DreamboundDisciple_BlessingOfTheGolem_EDR_847p,
	CardIds.LunarwingMessenger_BlessingOfTheMoon_EDR_449p,
];
const USE_UNCOLLECTIBLE_CARDS = [CardIds.Botface_TOY_906];
export const bwonsamdiBoonsEnchantments = [
	CardIds.TalanjiOfTheGraves_BoonOfPowerPlayerEnchEnchantment_TIME_619e,
	CardIds.TalanjiOfTheGraves_BoonOfSpeedPlayerEnchEnchantment_TIME_619e3,
	CardIds.TalanjiOfTheGraves_BoonOfLongevityPlayerEnchEnchantment_TIME_619e2,
];

export const getDynamicRelatedCardIds = (
	cardId: string,
	entityId: number,
	allCards: AllCardsService,
	inputOptions: {
		format: GameFormat;
		gameType: GameType;
		scenarioId: number;
		currentClass: string;
		deckState: DeckState;
		gameState: GameState;
		validArenaPool: readonly string[];
	},
): readonly string[] | { override: true; cards: readonly string[] } => {
	const result = getDynamicRelatedCardIdsInternal(cardId, entityId, allCards, inputOptions);
	return result;
};

const getDynamicRelatedCardIdsInternal = (
	cardId: string,
	entityId: number,
	allCards: AllCardsService,
	inputOptions: {
		format: GameFormat;
		gameType: GameType;
		scenarioId: number;
		currentClass: string;
		deckState: DeckState;
		gameState: GameState;
		validArenaPool: readonly string[];
	},
): readonly string[] | { override: true; cards: readonly string[] } => {
	const options = {
		...inputOptions,
		initialDecklist: inputOptions.deckState?.deckList?.map((c) => c.cardId) ?? [],
	};
	switch (cardId) {
		// Show static list of related card ids as possible options
		case CardIds.DreamplannerZephrys_ExtravagantTourToken_WORK_027t2:
		case CardIds.DreamplannerZephrys_HecticTourToken_WORK_027t3:
		case CardIds.DreamplannerZephrys_ModestTourToken_WORK_027t1:
		case CardIds.HopefulDryad_EDR_001:
		case CardIds.CostumeMerchant_DINO_427:
			return allCards.getCard(cardId).relatedCardDbfIds?.map((dbfId) => allCards.getCard(dbfId).id) ?? [];
		case CardIds.BitterbloomKnight_EDR_852:
		case CardIds.FlutterwingGuardian_EDR_800:
			return {
				override: true,
				cards: IMBUED_HERO_POWERS.filter((hp) => allCards.getCard(hp).classes?.includes(options.currentClass)),
			};

		// From the past
		case CardIds.FalseDisciple:
			return filterCards(
				allCards,
				// So that we don't get cards from the arena-specific pool instead
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectType(c, CardType.MINION) &&
					c.classes?.includes(CardClass[CardClass.PRIEST]) &&
					c.rarity?.toUpperCase() === CardRarity[CardRarity.LEGENDARY],
			);
		case CardIds.NeonInnovation_TIME_016:
			return filterCards(
				allCards,
				// So that we don't get cards from the arena-specific pool instead
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectTribe(c, Race.MECH) &&
					c.classes?.includes(CardClass[CardClass.PALADIN]),
			);
		case CardIds.TimeLostGlaive_TIME_444:
			return filterCards(
				allCards,
				// So that we don't get cards from the arena-specific pool instead
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectTribe(c, Race.DEMON),
			);
		case CardIds.Flashback_TIME_711:
			return filterCards(
				allCards,
				// So that we don't get cards from the arena-specific pool instead
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectType(c, CardType.MINION) &&
					hasCost(c, '==', 1),
			);
		case CardIds.AlternateReality_TIME_707:
			return filterCards(
				allCards,
				// So that we don't get cards from the arena-specific pool instead
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasMechanic(c, GameTag.CHOOSE_ONE),
			);
		case CardIds.FarseerWo_TIME_013:
			return filterCards(
				allCards,
				// So that we don't get cards from the arena-specific pool instead
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectType(c, CardType.SPELL) &&
					hasSpellSchool(c, SpellSchool.NATURE) &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.AlterTime_TIME_857:
			return filterCards(
				allCards,
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectType(c, CardType.SPELL) &&
					hasSpellSchool(c, SpellSchool.ARCANE) &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.TimelooperToki_TIME_861:
			return filterCards(
				allCards,
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectType(c, CardType.SPELL),
			);
		case CardIds.FadingMemory_TIME_040:
			return filterCards(
				allCards,
				// So that we don't get cards from the arena-specific pool instead
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectType(c, CardType.MINION) &&
					hasCost(c, '==', 5),
			);
		case CardIds.FinalFrontier_GDB_857:
			return filterCards(
				allCards,
				// So that we don't get cards from the arena-specific pool instead
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectType(c, CardType.MINION) &&
					hasCost(c, '==', 10) &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.TearReality:
			return filterCards(
				allCards,
				// So that we don't get cards from the arena-specific pool instead
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectType(c, CardType.SPELL) &&
					hasCorrectClass(c, CardClass.MAGE),
			);
		case CardIds.WhackAGnoll_MIS_700:
			return filterCards(
				allCards,
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectType(c, CardType.WEAPON) &&
					c.classes?.includes(CardClass[CardClass.PALADIN]),
			);
		case CardIds.ErodedSediment_WW_428:
			return filterCards(
				allCards,
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectTribe(c, Race.ELEMENTAL),
			);
		case CardIds.WaveOfNostalgia_MIS_701:
			return filterCards(
				allCards,
				{ ...options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
				cardId,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectRarity(c, CardRarity.LEGENDARY),
			);

		// We do it here so we don't recompute the data for every card
		case CardIds.JungleJammer:
			const fullGameState = options.deckState?.isOpponent
				? options.gameState?.fullGameState?.Opponent
				: options.gameState?.fullGameState?.Player;
			const entity = fullGameState?.AllEntities.find((e) => e.entityId === entityId);
			const tagValue = entity?.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? 1;
			return filterCards(
				allCards,
				options,
				cardId,
				(c) => c?.cost === tagValue && hasCorrectTribe(c, Race.BEAST),
			);
		case CardIds.ScrappyScavenger_TLC_461:
			const card = inputOptions.deckState.findCard(entityId)?.card;
			const hasBeenPlayed = card?.storedInformation?.manaLeftWhenPlayed != null;
			const targetCost = hasBeenPlayed
				? (card.storedInformation.manaLeftWhenPlayed ?? 0)
				: Math.min(10, Math.max(0, (options.deckState.manaLeft ?? 0) - (allCards.getCard(cardId)?.cost ?? 0)));
			return filterCards(
				allCards,
				options,
				cardId,
				(c) => hasCost(c, '==', targetCost) && canBeDiscoveredByClass(c, options.currentClass),
			);

		case CardIds.EmergencyMeeting_GDB_119:
			return [
				...CREWMATES,
				...filterCards(
					allCards,
					options,
					cardId,
					(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '<=', 3) && hasCorrectTribe(c, Race.DEMON),
				),
			];
		case CardIds.MaestraMaskMerchant_VAC_336:
			return (
				allCards
					.getCards()
					.filter((c) => c.collectible)
					.filter((c) => c?.type?.toUpperCase() === CardType[CardType.HERO])
					// No Galakrond
					.filter((c) => !c.id?.startsWith('DRG_'))
					// Usable in Wild, but not in Standard ("from the past")
					.filter((c) =>
						!!c.set
							? !isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, options.gameType) &&
								isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_WILD, options.gameType)
							: false,
					)
					// From another class
					.filter((c) => fromAnotherClass(c, options.currentClass))
					.sort(
						(a, b) =>
							(a.cost ?? 0) - (b.cost ?? 0) ||
							a.classes?.[0]?.localeCompare(b.classes?.[0] ?? '') ||
							a.name.localeCompare(b.name),
					)
					.map((c) => c.id)
			);
	}

	let filters = getDynamicFilters(cardId, entityId, allCards, options);
	if (filters == null) {
		return [];
	}

	let result: string[] = Array.isArray(filters)
		? filterCards(allCards, options, cardId, ...filters)
		: filterCards(allCards, options, cardId, filters);
	if (result.length === 0) {
		// If the pool is empty, remove "canBeDiscoveredByClass" requirement
		const newOptions = {
			...options,
			currentClass: '',
		};
		filters = getDynamicFilters(cardId, entityId, allCards, newOptions)!;
		result = Array.isArray(filters)
			? filterCards(allCards, options, cardId, ...filters)
			: filterCards(allCards, options, cardId, filters);
	}
	return result;
};

const getDynamicFilters = (
	cardId: string,
	entityId: number,
	allCards: AllCardsService,
	options: {
		format: GameFormat;
		gameType: GameType;
		currentClass: string;
		deckState: DeckState;
		gameState: GameState | null;
	},
): ((ref: ReferenceCard) => boolean | undefined) | ((ref: ReferenceCard) => boolean)[] | undefined => {
	switch (cardId) {
		case CardIds.BlazingInvocation_CORE_GIL_836:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.BATTLECRY) &&
				canBeDiscoveredByClass(c, options.currentClass);

		case CardIds.NecroticMortician:
		case CardIds.NecroticMortician_CORE_RLK_116:
			return (c) => hasCorrectRune(c, DkruneTypes.UNHOLYRUNE);
		case CardIds.Hematurge_CORE_RLK_066:
		case CardIds.Hematurge_RLK_066:
			return (c) => hasCorrectRune(c, DkruneTypes.BLOODRUNE);
		case CardIds.FrostStrike:
		case CardIds.FrostStrikeCore:
			return (c) => hasCorrectRune(c, DkruneTypes.FROSTRUNE);

		case CardIds.CorpseFarm_WW_374:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(
					c,
					'==',
					Math.min(
						8,
						getPlayerTag(
							getPlayerOrOpponentFromFullGameState(options.deckState, options.gameState),
							GameTag.CORPSES,
						),
					),
				) &&
				!hasCost(c, '==', 0); // Corpse Farm cannot be played if at 0 Corpses
		case CardIds.BlessingOfTheDragon_EmeraldPortalToken_EDR_445pt3:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.DRAGON) &&
				hasCost(
					c,
					'==',
					Math.min(
						10,
						getPlayerTag(
							getPlayerOrOpponentFromFullGameState(options.deckState, options.gameState),
							GameTag.IMBUES_THIS_GAME,
						),
					),
				);
		case CardIds.ShiftySophomore:
			return (c) => hasMechanic(c, GameTag.COMBO);

		case CardIds.ObserverOfMysteries_TOY_520:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasMechanic(c, GameTag.SECRET);
		case CardIds.Perjury_CORE_MAW_018:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasMechanic(c, GameTag.SECRET) &&
				fromAnotherClass(c, options.currentClass);
		case CardIds.DelayedProduct_MIS_305:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '>=', 8) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.CraftersAura_TOY_808:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 6);
		case CardIds.SpotTheDifference_TOY_374:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 3) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.IncredibleValue_TOY_046:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 4) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.HiddenObjects_TOY_037:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasMechanic(c, GameTag.SECRET) &&
				c.classes?.includes(CardClass[CardClass.MAGE]);
		case CardIds.WindowShopper_TOY_652:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.DEMON) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.BlindBox_TOY_643:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON);
		case CardIds.SilkStitching_TOY_822:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '<=', 4) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.CobaltSpellkin_DRG_075:
			return (c) =>
				!!options.currentClass &&
				c.classes?.includes(options.currentClass.toUpperCase()) &&
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '==', 1);
		case CardIds.ChaoticTendril_YOG_514:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '==', options.deckState.chaoticTendrilsPlayedThisMatch + 1);
		case CardIds.OnceUponATime_TOY_506:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				(hasCorrectTribe(c, Race.BEAST) ||
					hasCorrectTribe(c, Race.DRAGON) ||
					hasCorrectTribe(c, Race.ELEMENTAL) ||
					hasCorrectTribe(c, Race.MURLOC)) &&
				hasCost(c, '==', 3);
		case CardIds.PartnerAssignment:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.BEAST) &&
				(hasCost(c, '==', 2) || hasCost(c, '==', 3));
		case CardIds.FoolsGold_DEEP_022:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				(hasCorrectTribe(c, Race.PIRATE) || hasCorrectTribe(c, Race.ELEMENTAL)) &&
				fromAnotherClass(c, options.currentClass);
		case CardIds.RitualOfTheNewMoon_EDR_461:
			return (c) => hasCorrectType(c, CardType.MINION) && (hasCost(c, '==', 6) || hasCost(c, '==', 3));
		case CardIds.GorillabotA3:
		case CardIds.GorillabotA3Core:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.MECH) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.SubmergedMap_TLC_442:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.MURLOC) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.MismatchedFossils_DEEP_001:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				canBeDiscoveredByClass(c, options.currentClass) &&
				(hasCorrectTribe(c, Race.BEAST) || hasCorrectTribe(c, Race.UNDEAD));
		case CardIds.ObsidianRevenant_DEEP_005:
			return (c) =>
				hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.DEATHRATTLE) && hasCost(c, '<=', 3);
		case CardIds.Mothership_TSC_645:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MECH) && hasCost(c, '<=', 3);
		case CardIds.OasisOutlaws_WW_404:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.NAGA) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.CactusConstruct_WW_818:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 2) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.SaddleUp_WW_812:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && hasCost(c, '<=', 3);
		case CardIds.ReliquaryResearcher_WW_432:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasMechanic(c, GameTag.SECRET) &&
				c.classes?.includes(CardClass[CardClass.MAGE]);
		case CardIds.SneedsOldShredder_CORE_GVG_114:
		case CardIds.WishingWell_WW_415:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);
		case CardIds.MerchantOfLegend_TLC_514:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectRarity(c, CardRarity.LEGENDARY) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.WyrmrestPurifier:
			return (c) => canBeDiscoveredByClass(c, options.currentClass);

		// Random Class Cards from a specific class
		case CardIds.ShimmeringTempest:
		case CardIds.AstromancerSolarian_SolarianPrimeToken:
			return (c) => hasCorrectType(c, CardType.SPELL) && c.classes?.includes(CardClass[CardClass.MAGE]);
		case CardIds.LightforgedCrusader:
			return (c) => c.classes?.includes(CardClass[CardClass.PALADIN]);
		case CardIds.AnnounceDarkness_VAC_941:
			return (c) => c.classes?.includes(CardClass[CardClass.WARLOCK]);
		case CardIds.EnvoyOfTheGlade_EDR_873:
			return (c) => c.classes?.includes(CardClass[CardClass.DRUID]);

		case CardIds.WorldPillarFragmentToken_DEEP_999t3:
		case CardIds.MaruutStonebinder_DEEP_037:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.ELEMENTAL) &&
				canBeDiscoveredByClass(c, options.currentClass);

		// Random Legendaries
		case CardIds.ArchVillainRafaam_CORE_DAL_422:
		case CardIds.ChalkArtist_TOY_388:
		case CardIds.CryofrozenChampion_TIME_613:
		case CardIds.GoldenKobold:
		case CardIds.MarinTheManager_GoldenKoboldToken_VAC_702t4:
		case CardIds.TreasureSeekerElise_GoldenMonkeyToken:
		case CardIds.Transmogrifier:
		case CardIds.MisterClocksworth_TIME_038:
		case CardIds.MisterClocksworth_MisterClocksworthToken_TIME_038t1:
		case CardIds.MisterClocksworth_MisterClocksworthToken_TIME_038t2:
		case CardIds.MisterClocksworth_MisterClocksworthToken_TIME_038t3:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);

		// Random Weapons
		case CardIds.WorgenRoadie_InstrumentCaseToken:
		case CardIds.StadiumAnnouncer_TIME_034:
			return (c) => hasCorrectType(c, CardType.WEAPON);

		// Random X Mechanic
		// Random Outcast
		case CardIds.CalamitysGrasp:
		case CardIds.FelerinTheForgotten:
		case CardIds.WretchedExile:
			return (c) => hasMechanic(c, GameTag.OUTCAST);

		// Random Overload
		case CardIds.ShockHopper_YOG_524:
			return (c) => hasMechanic(c, GameTag.OVERLOAD);

		// Random Secret
		case CardIds.FacelessEnigma_TIME_860:
			return (c) => hasMechanic(c, GameTag.SECRET);
		case CardIds.RemixedDispenseOBot_MysteryDispenseOBotToken:
			return (c) => hasMechanic(c, GameTag.SECRET) && hasCorrectClass(c, CardClass.MAGE);

		// Random Rewind
		case CardIds.TimeMachine_TIME_035:
			return (c) => hasMechanic(c, GameTag.REWIND);

		// Random Mini
		case CardIds.Botface_TOY_906:
			return (c) => hasMechanic(c, GameTag.MINI);

		// Random Taunt
		case CardIds.Atlasaurus_DINO_431:
			return (c) => hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.TAUNT) && hasCost(c, '>=', 5);
		case CardIds.GuardDuty_DINO_433:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.TAUNT) &&
				(hasCost(c, '==', 6) || hasCost(c, '==', 4) || hasCost(c, '==', 2));

		// Discover X Mechanic
		// Discover Deathrattle
		case CardIds.CarrionStudies:
		case CardIds.AvantGardening_EDR_488:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.DEATHRATTLE) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.AssimilatingBlight_GDB_478:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.DEATHRATTLE) &&
				hasCost(c, '==', 3) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.StoryOfUmbra_DINO_415:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.DEATHRATTLE) &&
				hasCost(c, '>=', 5) &&
				canBeDiscoveredByClass(c, options.currentClass);

		case CardIds.Reconnaissance:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.DEATHRATTLE) &&
				fromAnotherClass(c, options.currentClass);

		// Discover Taunt
		case CardIds.FrightenedFlunky:
		case CardIds.FrightenedFlunkyCore:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.TAUNT) &&
				canBeDiscoveredByClass(c, options.currentClass);

		// Random Secret
		case CardIds.RuniTimeExplorer_TheNightholdToken_WON_053t4:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasMechanic(c, GameTag.SECRET) &&
				hasCorrectClass(c, CardClass.PALADIN);

		// Random X Tribe
		// Random Elementals
		case CardIds.MenacingNimbusCore:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL);
		case CardIds.Synthesize:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.ELEMENTAL) &&
				(hasCost(c, '==', 1) || hasCost(c, '==', 2) || hasCost(c, '==', 3));

		// Random Naga
		case CardIds.HuddleUp_WORK_012:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.NAGA);

		// Random Mech
		case CardIds.RemixedDispenseOBot_MerchDispenseOBotToken:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MECH);

		// Random Murlocs
		case CardIds.GnawingGreenfin_EDR_999:
		case CardIds.Howdyfin_WW_333:
		case CardIds.UnderlightAnglingRod:
		case CardIds.UnderlightAnglingRod_CORE_BT_018:
		case CardIds.Grunty_SC_013:
		case CardIds.UniteTheMurlocs_MegafinToken:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC);

		// Random Beasts
		case CardIds.JeweledMacaw:
		case CardIds.JeweledMacawCore:
		case CardIds.Webspinner_CORE_FP1_011:
		case CardIds.Webspinner_FP1_011:
		case CardIds.WildernessPack_MIS_104:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST);
		case CardIds.Ankylodon_DINO_422:
		case CardIds.Wormhole_TIME_602:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && hasCost(c, '==', 3);
		case CardIds.TheFoodChain_ShokkJungleTyrantToken_TLC_830t:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.BEAST) &&
				(c.attack === 8 || c.attack === 6 || c.attack === 4);
		case CardIds.OddMap_TLC_824:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.BEAST) &&
				(c?.attack ?? 0) % 2 === 1 &&
				canBeDiscoveredByClass(c, options.currentClass);

		// Random Demons
		case CardIds.Kiljaeden_GDB_145:
		case CardIds.CallOfTheVoidLegacy:
		case CardIds.BaneOfDoomLegacy:
		case CardIds.BaneOfDoomVanilla:
		case CardIds.BaneOfDoom_WON_323:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON);
		case CardIds.TheEternalHold_TIME_446:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON) && hasCost(c, '>=', 5);

		// Random Dragons
		case CardIds.TimeLostProtodrake:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON);
		case CardIds.PastConflux_TIME_436:
		case CardIds.PastConflux_PresentConfluxToken_TIME_436t1:
		case CardIds.PastConflux_FutureConfluxToken_TIME_436t2:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON) && hasCost(c, '>=', 5);

		// Random Undead
		case CardIds.ForgottenMillennium_TIME_615:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.UNDEAD);

		// Random Minions (other)
		case CardIds.Tortotem_DINO_412:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				(c.races?.includes(Race[Race.ALL]) || (c?.races?.length ?? 0) >= 2);

		// Discover an X Tribe
		// Discover a Dragon
		case CardIds.AzureExplorer:
		case CardIds.BronzeExplorer:
		case CardIds.BronzeExplorerCore:
		case CardIds.Darkrider_EDR_456:
		case CardIds.DraconicLackey:
		case CardIds.DraconicStudies:
		case CardIds.DrakefireAmulet:
		case CardIds.EmeraldExplorer_DRG_313:
		case CardIds.FlightOfTheBronze:
		case CardIds.NetherspiteHistorian:
		case CardIds.NetherspiteHistorian_CORE_KAR_062:
		case CardIds.PrimordialExplorer:
		case CardIds.Rheastrasza_WW_824:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.DRAGON) &&
				canBeDiscoveredByClass(c, options.currentClass);

		// Discover a Beast
		case CardIds.KaldoreiCultivator_TIME_730:
		case CardIds.PeacefulPiper:
		case CardIds.PeacefulPiper_HappyHippie:
		case CardIds.RaptorHerald_CORE_EDR_004:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.BEAST) &&
				canBeDiscoveredByClass(c, options.currentClass);
		// TODO: maybe move this to the other dynamic pool method
		case CardIds.BeastSpeakerTaka_DINO_430:
			// Scope the variables
			if (true) {
				const fullEntity =
					options?.gameState?.fullGameState?.Opponent?.AllEntities?.find((e) => e.entityId === entityId) ??
					options?.gameState?.fullGameState?.Player?.AllEntities?.find((e) => e.entityId === entityId) ??
					null;
				if (fullEntity) {
					const enchantments = fullEntity.enchantments?.filter(
						(e) => e.cardId === CardIds.BeastSpeakerTaka_LegendaryMountEnchantment_DINO_430e,
					);
					const allAttacks: number[] = [];
					const allHealths: number[] = [];
					for (const enchantment of enchantments) {
						const gainedAttack = enchantment?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1]?.Value ?? 0;
						const gainedHealth = enchantment?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_2]?.Value ?? 0;
						if (gainedHealth) {
							allHealths.push(gainedHealth);
							allAttacks.push(gainedAttack);
						}
					}
					if (allHealths.length > 0) {
						const numberOfSummons = allHealths.length;
						// We return all the cards that match the attack/health for each summon
						return (c) =>
							hasCorrectType(c, CardType.MINION) &&
							hasCorrectTribe(c, Race.BEAST) &&
							hasCorrectRarity(c, CardRarity.LEGENDARY) &&
							Array.from({ length: numberOfSummons }).some(
								(_, i) => hasAttack(c, '==', allAttacks[i]) && hasHealth(c, '==', allHealths[i]),
							);
					}
				}
				return (c) =>
					hasCorrectType(c, CardType.MINION) &&
					hasCorrectTribe(c, Race.BEAST) &&
					hasCorrectRarity(c, CardRarity.LEGENDARY);
			}
			return (c) => false;

		// Discover a Pirate
		case CardIds.BloodsailRecruiter_VAC_430:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.PIRATE) &&
				canBeDiscoveredByClass(c, options.currentClass);

		// Discover a Mech
		case CardIds.OmegaAssembly:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.MECH) &&
				canBeDiscoveredByClass(c, options.currentClass);

		// Discover an Elemental
		case CardIds.Whirlweaver:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.ELEMENTAL) &&
				canBeDiscoveredByClass(c, options.currentClass);

		// Discover a Demon
		case CardIds.WindowShopper_WindowShopperToken_TOY_652t:
		case CardIds.DemonicStudies:
		case CardIds.DemonicStudies_CORE_SCH_158:
		case CardIds.ShadowflameStalker_FIR_924:
		case CardIds.RelentlessWrathguard_GDB_132:
		case CardIds.DemonicDynamics:
		case CardIds.Netherwalker:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.DEMON) &&
				canBeDiscoveredByClass(c, options.currentClass);

		case CardIds.ExoticMountseller:
		case CardIds.TeachersPet:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && hasCost(c, '==', 3);
		case CardIds.PackKodo:
			return (c) =>
				((hasCorrectTribe(c, Race.BEAST) && hasCorrectType(c, CardType.MINION)) ||
					(hasCorrectType(c, CardType.SPELL) && c?.mechanics?.includes(GameTag[GameTag.SECRET])) ||
					hasCorrectType(c, CardType.WEAPON)) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.EverythingMustGo_TOY_519:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4);
		case CardIds.AzsharanScroll:
		case CardIds.AzsharanScroll_SunkenScrollToken:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				c?.classes?.includes(options.currentClass.toUpperCase()) &&
				(hasCorrectSpellSchool(c, SpellSchool.FIRE) ||
					hasCorrectSpellSchool(c, SpellSchool.FROST) ||
					hasCorrectSpellSchool(c, SpellSchool.NATURE));

		case CardIds.Jackpot:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) && hasCost(c, '>=', 5) && fromAnotherClass(c, options.currentClass);
		case CardIds.TheFiresOfZinAzshari:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '>=', 5);
		case CardIds.SunkenSweeper:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MECH);
		case CardIds.SubmergedSpacerock:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCorrectSpellSchool(c, SpellSchool.ARCANE) &&
				c.classes?.includes(CardClass[CardClass.MAGE]);
		case CardIds.SavoryDeviateDelight:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				(hasCorrectTribe(c, Race.PIRATE) || c.mechanics?.includes(GameTag[GameTag.STEALTH]));

		case CardIds.TrickTotem_SCH_537:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '<=', 3);

		// Discover a Spell Effects (or spell from class effects such as Peon / Magescribe)
		case CardIds.AmphibiousElixir_WW_080:
		case CardIds.Astrobiologist_GDB_874:
		case CardIds.BloodDraw_TIME_612:
		case CardIds.ChitteringTunneler:
		case CardIds.EtherealLackey:
		case CardIds.ExarchHataaru_GDB_136:
		case CardIds.GhostWriter:
		case CardIds.InfinitizeTheMaxitude:
		case CardIds.Jettison_GDB_227:
		case CardIds.Kalecgos_CORE_DAL_609:
		case CardIds.Marshspawn_CORE_BT_115:
		case CardIds.NerubianVizier:
		case CardIds.OnyxMagescribe:
		case CardIds.PalmReading:
		case CardIds.Peon_BAR_022:
		case CardIds.PlantedEvidence_CORE_REV_313:
		case CardIds.PlantedEvidence:
		case CardIds.PocketDimension_GDB_133:
		case CardIds.PrimordialGlyph_CORE_UNG_941:
		case CardIds.Qonzu_EDR_517:
		case CardIds.RangerGeneralSylvanas_RangerCaptainAlleriaToken_TIME_609t1:
		case CardIds.Renew_BT_252:
		case CardIds.RunedOrb_BAR_541:
		case CardIds.Spellcoiler:
		case CardIds.StewardOfScrolls_SCH_245:
		case CardIds.SuspiciousAlchemist:
		case CardIds.VenomousScorpid:
		case CardIds.VoidScripture_YOG_507:
		case CardIds.VulperaScoundrel:
		case CardIds.VulperaScoundrelCore:
			return (c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.InstructorFireheart:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '>=', 1) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.SchoolTeacher:
		case CardIds.TidePools_VAC_522:
		case CardIds.VastWisdom:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '<=', 3) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.KajamiteCreation:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) && hasCost(c, '<=', 3) && fromAnotherClass(c, options.currentClass);
		case CardIds.HighborneMentor_TIME_704:
		case CardIds.HighborneMentor_HighbornePupilToken_TIME_704t:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '>=', 7) &&
				canBeDiscoveredByClass(c, options.currentClass);

		// Discover X Spell School Spell(s)
		case CardIds.LightningReflexes:
			return (c) =>
				hasCorrectSpellSchool(c, SpellSchool.NATURE) &&
				hasCorrectType(c, CardType.SPELL) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.Scorchreaver_FIR_952:
		case CardIds.HiveMap_TLC_900:
		case CardIds.TasteOfChaos:
			return (c) => canBeDiscoveredByClass(c, options.currentClass) && hasCorrectSpellSchool(c, SpellSchool.FEL);
		case CardIds.SisterSvalna_VisionOfDarknessToken:
			return (c) =>
				canBeDiscoveredByClass(c, options.currentClass) && hasCorrectSpellSchool(c, SpellSchool.SHADOW);

		// Discover a Choose One card
		case CardIds.RaidNegotiator:
			return (c) => hasMechanic(c, GameTag.CHOOSE_ONE) && canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.Symbiosis_EDR_273:
			return (c) => hasMechanic(c, GameTag.CHOOSE_ONE) && fromAnotherClass(c, options.currentClass);

		// Discover a Weapon Effects (or spell from class effects such as Peon / Magescribe)
		case CardIds.RunesOfDarkness_YOG_511:
		case CardIds.SuspiciousPirate:
			return (c) => hasCorrectType(c, CardType.WEAPON) && canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.NefersetWeaponsmith_TLC_516:
			return (c) => hasCorrectType(c, CardType.WEAPON) && fromAnotherClass(c, options.currentClass);

		// Discover a Class Card
		// Paladin
		case CardIds.MuckbornServant:
		case CardIds.MuckbornServant_CORE_REV_947:
			return (c) => hasCorrectClass(c, CardClass.PALADIN);

		// Discover a Legendary Minion Effects
		case CardIds.TreacherousTormentor_EDR_102:
		case CardIds.SuspiciousUsher_CORE_REV_002:
		case CardIds.HerosWelcome_DINO_424:
		case CardIds.Paparazzi:
		case CardIds.ZarogsCrown:
		case CardIds.MarinTheManager_ZarogsCrownToken_VAC_702t:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectRarity(c, CardRarity.LEGENDARY) &&
				canBeDiscoveredByClass(c, options.currentClass);

		// Random Spells
		// Random Class Spells
		case CardIds.BabblingBook:
		case CardIds.BabblingBookCore:
		case CardIds.BabblingBookcase_CORE_EDR_001:
		case CardIds.WandThief_SCH_350:
			return (c) => hasCorrectType(c, CardType.SPELL) && c.classes?.includes(CardClass[CardClass.MAGE]);
		case CardIds.AeonWizard_TIME_002:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCorrectClass(c, options.currentClass ? CardClass[options.currentClass.toUpperCase()] : undefined);
		case CardIds.FiddlefireImp:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCorrectSpellSchool(c, SpellSchool.FIRE) &&
				(hasCorrectClass(c, CardClass.MAGE) || hasCorrectClass(c, CardClass.WARLOCK));

		// Random X-Cost Spells
		case CardIds.PettyTheft_VAC_335:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 1) && fromAnotherClass(c, options.currentClass);

		// Discover an X cost card
		case CardIds.DarkPeddler_CORE_WON_096:
		case CardIds.SuspiciousPeddler:
			return (c) => canBeDiscoveredByClass(c, options.currentClass) && hasCost(c, '==', 1);
		case CardIds.ScarabKeychain_TOY_006:
			return (c) => canBeDiscoveredByClass(c, options.currentClass) && hasCost(c, '==', 2);
		case CardIds.EmberscarredWhelp_FIR_927:
			return (c) => canBeDiscoveredByClass(c, options.currentClass) && hasCost(c, '==', 5);

		// Discover an X cost minion
		case CardIds.BloodpetalBiome_TLC_449:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 1) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.CreatureOfMadness_EDR_105:
		case CardIds.RitualOfLife_DINO_426:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 3) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.PowerOfCreation:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 6) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.FreeFromAmber:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '>=', 8) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.TravelSecurity_WORK_010:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8);

		case CardIds.TrainingSession_NX2_029:
		case CardIds.HikingTrail_VAC_517:
		case CardIds.StonehillDefender_Core_UNG_072:
		case CardIds.IKnowAGuy_CORE_WON_350:
		case CardIds.IKnowAGuy_WON_350:
		case CardIds.IvoryRook_WON_116:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.TAUNT) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.StandardizedPack_MIS_705:
		case CardIds.InFormation:
			return (c) => hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.TAUNT);
		case CardIds.SmokeBomb_FIR_920:
			return (c) =>
				canBeDiscoveredByClass(c, options.currentClass) &&
				hasCorrectType(c, CardType.MINION) &&
				(hasMechanic(c, GameTag.COMBO) || hasMechanic(c, GameTag.BATTLECRY) || hasMechanic(c, GameTag.STEALTH));
		case CardIds.ShadowflameSuffusion_FIR_939:
			return (c) => hasCorrectType(c, CardType.MINION) && c.classes?.includes(CardClass[CardClass.WARRIOR]);
		case CardIds.AmbassadorFaelin_TSC_067:
			return (c) => hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.COLOSSAL);
		case CardIds.FyrakkTheBlazing_FIR_959:
			return (c) => hasCorrectSpellSchool(c, SpellSchool.FIRE) && hasCorrectType(c, CardType.SPELL);
		case CardIds.Cremate_FIR_900:
			return (c) => hasCorrectType(c, CardType.MINION) && canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.InfernoHerald_FIR_913:
			return (c) => hasCorrectTribe(c, Race.ELEMENTAL);
		case CardIds.FarmHand_WW_358:
		case CardIds.ToysnatchingGeist_MIS_006:
		case CardIds.ToysnatchingGeist_ToysnatchingGeistToken_MIS_006t:
		case CardIds.RiteOfAtrocity_EDR_811:
		case CardIds.Paleomancy_TLC_434:
			return (c) => hasCorrectTribe(c, Race.UNDEAD) && canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.SweetenedSnowflurry_TOY_307:
		case CardIds.SweetenedSnowflurry_SweetenedSnowflurryToken_TOY_307t:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.FROST);
		case CardIds.CryptMap_TLC_435:
			return (c) => hasCorrectRune(c, DkruneTypes.FROSTRUNE) && canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.SparkOfLife_EDR_872:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				(c.classes?.includes(CardClass[CardClass.MAGE]) || c.classes?.includes(CardClass[CardClass.DRUID]));
		case CardIds.GiftOfFire_EDR_872A:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				c.classes?.includes(CardClass[CardClass.MAGE]) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.GiftOfNature_EDR_872B:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				c.classes?.includes(CardClass[CardClass.DRUID]) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.ForbiddenShrine_EDR_520:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(
					c,
					'==',
					Math.min(
						10,
						Math.max(0, (options.deckState.manaLeft ?? 0) - (allCards.getCard(cardId)?.cost ?? 0)),
					),
				);
		case CardIds.Alarashi_EDR_493:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON);
		case CardIds.Jumpscare_EDR_882:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.DEMON) &&
				hasCost(c, '>=', 5) &&
				canBeDiscoveredByClass(c, options.currentClass);

		case CardIds.Photosynthesis_EDR_848:
			return (c) => hasCorrectType(c, CardType.SPELL) && c.classes?.includes(CardClass[CardClass.DRUID]);

		case CardIds.DaydreamingPixie_EDR_530:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.NATURE);
		case CardIds.HornOfPlenty_EDR_270:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCorrectSpellSchool(c, SpellSchool.NATURE) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.DragonTales_WW_821:
		case CardIds.Ysondre_EDR_465:
		case CardIds.SelenicDrake_EDR_462:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON);

		case CardIds.FlintFirearm_WW_379:
			return (c) => c?.mechanics?.includes(GameTag[GameTag.QUICKDRAW]);
		case CardIds.StickUp_WW_411:
			return (c) =>
				c?.mechanics?.includes(GameTag[GameTag.QUICKDRAW]) && fromAnotherClass(c, options.currentClass);
		case CardIds.LifebindersGift:
		case CardIds.LifebindersBloom:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.NATURE);
		case CardIds.CruiseCaptainLora_VAC_506:
		case CardIds.TravelAgent_VAC_438:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.LOCATION];
		case CardIds.DemonicDeal_WORK_014:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '>=', 5) && hasCorrectTribe(c, Race.DEMON);
		case CardIds.Blasteroid_GDB_303:
		case CardIds.Supernova_GDB_301:
			return (c) =>
				c?.id !== cardId &&
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c?.spellSchool?.includes(SpellSchool[SpellSchool.FIRE]);
		case CardIds.ResonanceCoil_SC_760:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasMechanic(c, GameTag.PROTOSS);
		case CardIds.Mothership_SC_762:
			return (c) => hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.PROTOSS);
		case CardIds.BroodQueen_LarvaToken_SC_003t:
		case CardIds.BroodQueen_SC_003:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.ZERG) &&
				c?.id !== CardIds.BroodQueen_SC_003;
		case CardIds.WaywardProbe_SC_500:
			return (c) => hasMechanic(c, GameTag.STARSHIP_PIECE);
		case CardIds.DetailedNotes_GDB_844:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.BEAST) &&
				canBeDiscoveredByClass(c, options.currentClass) &&
				hasCost(c, '>=', 5);

		// Random X Cost Minion(s)
		case CardIds.BuildingBlockGolem_MIS_314:
		case CardIds.FirstContact_GDB_864:
		case CardIds.UndefeatedChampion_TIME_872:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1);
		case CardIds.RayllaSandSculptor_VAC_424:
		case CardIds.AegisOfLight_EDR_264:
		case CardIds.DistressSignal_GDB_883:
		case CardIds.DwarfPlanet_GDB_233:
		case CardIds.FirstDayOfSchool:
		case CardIds.MaelstromPortal_CORE_KAR_073:
		case CardIds.MazeGuide_CORE_REV_308:
		case CardIds.MazeGuide:
		case CardIds.ShimmerShot_DEEP_003:
		case CardIds.ShriekingShroom:
		case CardIds.TunnelTerror_TLC_469:
		case CardIds.TwilightInfluence_EDR_463:
		case CardIds.TwilightInfluence_ControllingVines_EDR_463b:
		case CardIds.PaltryFlutterwing_TIME_058:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);
		case CardIds.FacelessLackey:
		case CardIds.HarbingerOfTheBlighted_EDR_781:
		case CardIds.HiddenMeaning:
		case CardIds.KureTheLightBeyond_GDB_442:
		case CardIds.LinedancePartner_WW_433:
		case CardIds.SerpentshrinePortal_BT_100:
		case CardIds.SilvermoonPortal_CORE_KAR_077:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3);
		case CardIds.CrystalBroker:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', (options?.deckState?.hero?.maxMana ?? 0) >= 10 ? 8 : 3);
		case CardIds.IronforgePortal:
		case CardIds.IronforgePortal_WON_337:
		case CardIds.ThreshridersBlessing_TLC_477:
		case CardIds.GravedawnVoidbulb_TLC_815:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4);
		case CardIds.UnearthedArtifacts_TLC_462:
			return (c) => hasCorrectType(c, CardType.MINION) && (hasCost(c, '==', 2) || hasCost(c, '==', 4));
		case CardIds.JandiceBarov_SCH_351:
		case CardIds.WardOfEarth_EDR_060:
		case CardIds.DangerousVariant_TIME_049:
		case CardIds.Stormrook_TIME_217:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 5);
		case CardIds.BigBadArchmage:
		case CardIds.ChaosCreation_DEEP_031:
		case CardIds.FirelandsPortal:
		case CardIds.FirelandsPortalCore:
		case CardIds.MoongladePortal_KAR_075:
		case CardIds.RitualOfTheNewMoon_RitualOfTheFullMoonToken_EDR_461t:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 6);
		case CardIds.PlaguedProtodrake:
		case CardIds.UnknownVoyager_TIME_055:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 7);
		case CardIds.ContainmentUnit:
		case CardIds.MedivhTheHallowed_KarazhanTheSanctumToken_TIME_890t2:
		case CardIds.Circadiamancer_TIME_102:
		case CardIds.Dethrone_TIME_712:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8);
		case CardIds.SunsetVolley_WW_427:
		case CardIds.Anomalize_TIME_859:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 10);
		case CardIds.TalanjiOfTheGraves_BwonsamdiToken_TIME_619t:
			return (c) => {
				// We need to hard-code the cost reduction of boons, because we don't have a global tag or enchantment for this
				const boons = options?.deckState?.enchantments?.filter((e) =>
					bwonsamdiBoonsEnchantments.includes(e.cardId as CardIds),
				);
				const boonsCount = boons?.length ?? 0;
				const cost = 4 + 2 * boonsCount;
				return hasCorrectType(c, CardType.MINION) && hasCost(c, '==', cost);
			};

		case CardIds.RelicOfKings_TLC_334:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '>=', 8) &&
				!c.classes?.includes(CardClass[CardClass.NEUTRAL]);
		case CardIds.RaptorNestNurse_DINO_434:
			return (c) =>
				(hasCorrectType(c, CardType.MINION) || hasCorrectType(c, CardType.SPELL)) && hasCost(c, '==', 1);

		// Random X Spell School Spell(s)
		case CardIds.ExarchOthaar_GDB_856:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.ARCANE);
		case CardIds.WhisperingStone_TLC_467:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.FEL);
		case CardIds.Pyrotechnician:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.FIRE);
		case CardIds.UmbralGeist:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.SHADOW);
		case CardIds.RemixedDispenseOBot_ChillingDispenseOBotToken:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.FROST);
		case CardIds.DruidOfRegrowth_TIME_033:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.NATURE);
		case CardIds.TwilightMender_TLC_814:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				(hasCorrectSpellSchool(c, SpellSchool.SHADOW) || hasCorrectSpellSchool(c, SpellSchool.HOLY));
		case CardIds.MendTheTimeline_TIME_018:
			return (c) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.HOLY);

		case CardIds.HologramOperator_GDB_723:
		case CardIds.OrbitalSatellite_GDB_462:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAENEI);

		case CardIds.AbductionRay_GDB_123:
			return (c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON);
		case CardIds.Nebula_GDB_479:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 8) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.Wandmaker:
		case CardIds.Wandmaker_CORE_SCH_160:
			return (c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '==', 1) &&
				c?.classes?.includes(options.currentClass.toUpperCase());
		case CardIds.PrimordialStudies_SCH_270:
			return [
				(c) => c?.id !== CardIds.Sif,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					hasMechanic(c, GameTag.SPELLPOWER) &&
					canBeDiscoveredByClass(c, options.currentClass),
			];
		case CardIds.AthleticStudies_SCH_237:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.RUSH) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.IllidariStudiesCore:
		case CardIds.IllidariStudies_YOP_001:
			return (c) => hasMechanic(c, GameTag.OUTCAST) && canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.NatureStudies_SCH_333:
			return (c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, options.currentClass);

		case CardIds.GalacticCrusader_GDB_862:
		case CardIds.WatcherOfTheSun:
		case CardIds.WatcherOfTheSun_WatcherOfTheSunToken:
			return (c) => hasCorrectType(c, CardType.SPELL) && c.spellSchool?.includes(SpellSchool[SpellSchool.HOLY]);
		case CardIds.ScroungingShipwright_GDB_876:
		case CardIds.StarshipSchematic_GDB_102:
			return (c) => hasMechanic(c, GameTag.STARSHIP_PIECE) && fromAnotherClass(c, options.currentClass);
		case CardIds.LuckyComet_GDB_873:
			return (c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.COMBO) &&
				canBeDiscoveredByClass(c, options.currentClass);
		default:
			return undefined;
	}
};

const BAN_LIST = [
	// https://hearthstone.wiki.gg/wiki/Special:RunQuery/WikiBanPool?pfRunQueryFormName=WikiBanPool&wpRunQuery=Run%2Bquery&WikiBanPool_form_only%5BoriginalPage%5D=Nebula&WikiBanPool_form_only%5Bid%5D=2&WikiBanPool_form_only%5BgameMode%5D=1
	CardIds.BounceAroundFtGarona,
	CardIds.CthunTheShattered,
	CardIds.ClimacticNecroticExplosion,
	CardIds.TheGalacticProjectionOrb_TOY_378,
	// https://hearthstone.wiki.gg/wiki/Special:RunQuery/WikiBanPool?pfRunQueryFormName=WikiBanPool&wpRunQuery=Run%2Bquery&WikiBanPool_form_only%5BoriginalPage%5D=Nebula&WikiBanPool_form_only%5Bid%5D=12&WikiBanPool_form_only%5BgameMode%5D=1
	CardIds.Magtheridon_BT_850,
	CardIds.TheDarkness_LOOT_526,
	CardIds.ZilliaxDeluxe3000_TOY_330,
];

const BAN_LIST_ARENA = [CardIds.Kiljaeden_GDB_145];

let uncollectibleCards: readonly ReferenceCard[] = [];
let baseCards: readonly ReferenceCard[] = [];

export const filterCards = (
	allCards: AllCardsService,
	options: {
		format: GameFormat;
		gameType: GameType;
		scenarioId: number;
		initialDecklist?: readonly string[];
		validArenaPool: readonly string[];
	},
	sourceCardId: string,
	...filters: ((ref: ReferenceCard) => boolean | undefined)[]
) => {
	let gameType = options.gameType;
	let format = options.format;
	const summonsInPlay = doesSummonInPlay(sourceCardId);
	const baseCards = getBaseCards(sourceCardId, allCards);
	const baseCardsExtended = baseCards
		.filter((c) => (isArena(options.gameType) ? !BAN_LIST_ARENA.includes(c.id as CardIds) : true))
		.filter((c) => (summonsInPlay ? !hasMechanic(c, GameTag.COLOSSAL) : true))
		.filter((c) => canIncludeStarcraftFaction(c, options.initialDecklist, allCards))
		.filter((c) => {
			if (gameType === GameType.GT_ARENA || gameType === GameType.GT_UNDERGROUND_ARENA) {
				// If we have some valid arena sets, we use them
				if (!arenaSets?.length) {
					if (options.validArenaPool.length > 0) {
						return options.validArenaPool.includes(c.id);
					} else {
						// Default to ranked wild otherwise
						gameType = GameType.GT_RANKED;
						format = GameFormat.FT_WILD;
					}
				}
			} else if (gameType === GameType.GT_TAVERNBRAWL) {
				const setsForCurrentBrawl = brawlSets[options.scenarioId];
				if (setsForCurrentBrawl.length > 0) {
					return setsForCurrentBrawl.includes(c.set.toLowerCase() as SetId);
				}
				// Use the default pool otherwise
			}
			return !!c.set ? isValidSet(c.set.toLowerCase() as SetId, format, gameType) : false;
		})
		.filter((c) => !sourceCardId || c.id !== sourceCardId);
	return baseCardsExtended.filter((c) => filters.every((f) => f(c))).map((c) => c.id);
};

const getBaseCards = (sourceCardId: string, allCards: AllCardsService): readonly ReferenceCard[] => {
	if (uncollectibleCards.length === 0) {
		uncollectibleCards = allCards
			.getCards()
			// https://hearthstone.wiki.gg/wiki/Special:RunQuery/WikiBanPool?pfRunQueryFormName=WikiBanPool&wpRunQuery=Run%2Bquery&WikiBanPool_form_only%5BoriginalPage%5D=Nebula&WikiBanPool_form_only%5Bid%5D=13&WikiBanPool_form_only%5BgameMode%5D=1
			.filter((c) => !hasMechanic(c, GameTag.TITAN))
			.filter(
				(c) =>
					!hasMechanic(c, GameTag.FABLED) &&
					!hasMechanic(c, GameTag.FABLED_PLUS) &&
					!hasMechanic(c, GameTag.IS_FABLED_BUNDLE_CARD),
			)
			.filter((c) => !BAN_LIST.includes(c.id as CardIds))
			// https://hearthstone.wiki.gg/wiki/Special:RunQuery/WikiBanPool?pfRunQueryFormName=WikiBanPool&wpRunQuery=Run%2Bquery&WikiBanPool_form_only%5BoriginalPage%5D=Nebula&WikiBanPool_form_only%5Bid%5D=6&WikiBanPool_form_only%5BgameMode%5D=1
			.filter(
				(c) =>
					!hasMechanic(c, GameTag.QUEST) &&
					!hasMechanic(c, GameTag.QUESTLINE) &&
					!hasMechanic(c, GameTag.QUESTLINE_PART),
			)
			.filter((c) => !hasThreeRunes(c))
			.sort(
				(a, b) =>
					(a.cost ?? 0) - (b.cost ?? 0) ||
					a.classes?.[0]?.localeCompare(b.classes?.[0] ?? '') ||
					a.name.localeCompare(b.name),
			);
	}
	if (baseCards.length === 0) {
		baseCards = uncollectibleCards.filter((c) => c.collectible);
	}
	return USE_UNCOLLECTIBLE_CARDS.includes(sourceCardId as CardIds) ? uncollectibleCards : baseCards;
};

// TODO: Move these to the hs-reference-data repo so it's all in the same place.

export const hasCorrectType = (card: ReferenceCard, targetType: CardType): boolean => {
	return card?.type?.toUpperCase() === CardType[targetType];
};

const hasCorrectSpellSchool = (card: ReferenceCard, targetSpellSchool: SpellSchool): boolean => {
	return card?.spellSchool?.toUpperCase() === SpellSchool[targetSpellSchool];
};

export const hasCorrectClass = (card: ReferenceCard, targetClass: CardClass | null): boolean => {
	if (!targetClass) {
		return false;
	}
	return card?.classes?.includes(CardClass[targetClass]) ?? false;
};

export const hasCorrectRarity = (card: ReferenceCard, targetRarity: CardRarity): boolean => {
	return card?.rarity?.toUpperCase() === CardRarity[targetRarity];
};

const getPlayerTag = (
	playerGameState: PlayerGameState | undefined,
	gameTag: GameTag,
	defaultValue: number = 0,
): number => {
	return playerGameState?.PlayerEntity?.tags?.find((t) => t.Name === gameTag)?.Value ?? defaultValue;
};

const hasCorrectRune = (card: ReferenceCard, runeType: DkruneTypes): boolean => {
	switch (runeType) {
		case DkruneTypes.BLOODRUNE:
			return (card?.additionalCosts?.BLOODRUNE ?? 0) > 0;
		case DkruneTypes.UNHOLYRUNE:
			return (card?.additionalCosts?.UNHOLYRUNE ?? 0) > 0;
		case DkruneTypes.FROSTRUNE:
			return (card?.additionalCosts?.FROSTRUNE ?? 0) > 0;
		default:
			return false;
	}
};

// https://hearthstone.wiki.gg/wiki/Special:RunQuery/WikiBanPool?pfRunQueryFormName=WikiBanPool&wpRunQuery=Run%2Bquery&WikiBanPool_form_only%5BoriginalPage%5D=Nebula&WikiBanPool_form_only%5Bid%5D=10&WikiBanPool_form_only%5BgameMode%5D=1
const hasThreeRunes = (card: ReferenceCard): boolean => {
	if (!card.additionalCosts) {
		return false;
	}
	return (
		Object.keys(card.additionalCosts)
			.filter((key) => key.includes('RUNE'))
			.map((key) => card.additionalCosts![key])
			.reduce((a, b) => a + b, 0) >= 3
	);
};

export const canBeDiscoveredByClass = (card: ReferenceCard, currentClass: string): boolean => {
	if (!currentClass?.length) {
		console.log('canBeDiscoveredByClass: no current class');
		return true;
	}
	if (!card.classes?.length) {
		return true;
	}
	return card.classes.includes(currentClass.toUpperCase()) || card.classes.includes(CardClass[CardClass.NEUTRAL]);
};

export const fromAnotherClass = (card: ReferenceCard, currentClass: string | null | undefined): boolean => {
	if (!currentClass) {
		return false;
	}
	return (
		!card?.classes?.includes(CardClass[CardClass.NEUTRAL]) && !card?.classes?.includes(currentClass?.toUpperCase())
	);
};

const getPlayerOrOpponentFromFullGameState = (
	deckState: DeckState,
	gameState: GameState | null,
): PlayerGameState | undefined => {
	return deckState.isOpponent ? gameState?.fullGameState?.Opponent : gameState?.fullGameState?.Player;
};

export const hasOverride = (
	result: readonly string[] | { override: true; cards: readonly string[] },
): result is {
	override: true;
	cards: readonly string[];
} => {
	return (result as { override: true; cards: readonly string[] })?.override;
};

export const hasCost = (
	card: ReferenceCard,
	operator: '==' | '<=' | '>=' | '<' | '>' = '==',
	value: number,
): boolean => {
	const cost = card?.cost ?? 0;
	switch (operator) {
		case '==':
			return cost === value;
		case '<=':
			return cost <= value;
		case '>=':
			return cost >= value;
		case '<':
			return cost < value;
		case '>':
			return cost > value;
		default:
			return false;
	}
};

const hasAttack = (card: ReferenceCard, operator: '==' | '<=' | '>=' | '<' | '>' = '==', value: number): boolean => {
	const attack = card?.attack ?? 0;
	switch (operator) {
		case '==':
			return attack === value;
		case '<=':
			return attack <= value;
		case '>=':
			return attack >= value;
		case '<':
			return attack < value;
		case '>':
			return attack > value;
	}
};

const hasHealth = (card: ReferenceCard, operator: '==' | '<=' | '>=' | '<' | '>' = '==', value: number): boolean => {
	const health = card?.health ?? 0;
	switch (operator) {
		case '==':
			return health === value;
		case '<=':
			return health <= value;
		case '>=':
			return health >= value;
		case '<':
			return health < value;
		case '>':
			return health > value;
	}
};

const canIncludeStarcraftFaction = (
	refCard: ReferenceCard,
	initialDecklist: readonly string[] | undefined,
	allCards: AllCardsService,
): boolean => {
	if (!initialDecklist?.length) {
		return true;
	}

	if (
		!refCard.mechanics?.includes(GameTag[GameTag.ZERG]) &&
		!refCard.mechanics?.includes(GameTag[GameTag.PROTOSS]) &&
		!refCard.mechanics?.includes(GameTag[GameTag.TERRAN])
	) {
		return true;
	}

	// https://x.com/RidiculousHat/status/1880304533978661025
	if (
		[CardIds.MissilePod_SC_409, CardIds.UltraCapacitor_SC_405, CardIds.YamatoCannon_SC_406].includes(
			refCard.id as CardIds,
		)
	) {
		return true;
	}

	const isZergOk = hasFaction(refCard, GameTag.ZERG) && hasFactionInDecklist(initialDecklist, GameTag.ZERG, allCards);
	const isProtossOk =
		hasFaction(refCard, GameTag.PROTOSS) && hasFactionInDecklist(initialDecklist, GameTag.PROTOSS, allCards);
	const isTerranOk =
		hasFaction(refCard, GameTag.TERRAN) && hasFactionInDecklist(initialDecklist, GameTag.TERRAN, allCards);
	return isZergOk || isProtossOk || isTerranOk;
};

const hasFaction = (card: ReferenceCard, faction: GameTag): boolean => {
	return card.mechanics?.includes(GameTag[faction]);
};

const hasFactionInDecklist = (decklist: readonly string[], faction: GameTag, allCards: AllCardsService): boolean => {
	for (const cardId of decklist) {
		const refCard = allCards.getCard(cardId);
		if (!refCard) {
			return true;
		}
		if (refCard.mechanics?.includes(GameTag[faction])) {
			return true;
		}
	}
	return false;
};

const doesSummonInPlay = (sourceCardId: string): boolean => {
	switch (sourceCardId) {
		// Portal cards that summon minions directly
		case CardIds.PastConflux_TIME_436:
		case CardIds.PastConflux_PresentConfluxToken_TIME_436t1:
		case CardIds.PastConflux_FutureConfluxToken_TIME_436t2:
		case CardIds.FirelandsPortal:
		case CardIds.FirelandsPortalCore:
		case CardIds.MaelstromPortal_CORE_KAR_073:
		case CardIds.SilvermoonPortal_CORE_KAR_077:
		case CardIds.IronforgePortal:
		case CardIds.IronforgePortal_WON_337:
		case CardIds.MoongladePortal_KAR_075:
		case CardIds.SerpentshrinePortal_BT_100:
		case CardIds.TalanjiOfTheGraves_BwonsamdiToken_TIME_619t:
		case CardIds.Wormhole_TIME_602:
		case CardIds.MedivhTheHallowed_KarazhanTheSanctumToken_TIME_890t2:
		case CardIds.UnknownVoyager_TIME_055:
		case CardIds.PaltryFlutterwing_TIME_058:
		case CardIds.DangerousVariant_TIME_049:
		case CardIds.Stormrook_TIME_217:
		case CardIds.Dethrone_TIME_712:
		case CardIds.Flashback_TIME_711:
		case CardIds.Anomalize_TIME_859:
			return true;

		// Cards that summon specific minions directly
		case CardIds.BigBadArchmage:
		case CardIds.JandiceBarov_SCH_351:
		case CardIds.PlaguedProtodrake:
		case CardIds.ContainmentUnit:
		case CardIds.SunsetVolley_WW_427:
		case CardIds.ChaosCreation_DEEP_031:
		case CardIds.WardOfEarth_EDR_060:
		case CardIds.RitualOfTheNewMoon_RitualOfTheFullMoonToken_EDR_461t:
			return true;

		// Cards that summon multiple minions
		case CardIds.FirstDayOfSchool:
		case CardIds.MazeGuide_CORE_REV_308:
		case CardIds.MazeGuide:
		case CardIds.ShimmerShot_DEEP_003:
		case CardIds.ShriekingShroom:
		case CardIds.TunnelTerror_TLC_469:
		case CardIds.FacelessLackey:
		case CardIds.HarbingerOfTheBlighted_EDR_781:
		case CardIds.HiddenMeaning:
		case CardIds.KureTheLightBeyond_GDB_442:
		case CardIds.LinedancePartner_WW_433:
		case CardIds.TwilightInfluence_EDR_463:
		case CardIds.ThreshridersBlessing_TLC_477:
		case CardIds.GravedawnVoidbulb_TLC_815:
		case CardIds.UnearthedArtifacts_TLC_462:
			return true;

		// Cards that summon based on cost
		case CardIds.RayllaSandSculptor_VAC_424:
		case CardIds.AegisOfLight_EDR_264:
		case CardIds.BuildingBlockGolem_MIS_314:
		case CardIds.DistressSignal_GDB_883:
		case CardIds.DwarfPlanet_GDB_233:
		case CardIds.FirstContact_GDB_864:
			return true;

		// Cards that summon tokens or specific creatures
		case CardIds.CrystalBroker: // Summons minions based on mana
		case CardIds.RaptorNestNurse_DINO_434: // Summons 1-cost minions/spells
			return true;

		// Cards that fill the board or summon multiple
		case CardIds.InFormation: // Summons Taunt minions
		case CardIds.StandardizedPack_MIS_705: // Summons Taunt minions
			return true;

		// Specific summoning effects
		case CardIds.Cremate_FIR_900: // Summons minions
		case CardIds.InfernoHerald_FIR_913: // Summons Elementals
			return true;

		// Cards that summon based on game state
		case CardIds.TravelSecurity_WORK_010: // Summons 8-cost minions
			return true;

		default:
			return false;
	}
};
