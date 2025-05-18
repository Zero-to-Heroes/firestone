/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import {
	AllCardsService,
	CardClass,
	CardIds,
	CardRarity,
	CardType,
	CREWMATES,
	GameFormat,
	GameTag,
	GameType,
	hasCorrectTribe,
	hasMechanic,
	isValidSet,
	Race,
	ReferenceCard,
	SetId,
	SpellSchool,
} from '@firestone-hs/reference-data';

import {
	DeckState,
	GameState,
	PlayerGameState,
} from '@firestone/game-state';

const IMBUED_HERO_POWERS = [
	CardIds.BlessingOfTheDragon_EDR_445p,
	CardIds.BlessingOfTheWolf_EDR_850p,
	CardIds.BlessingOfTheWind_EDR_448p,
	CardIds.DreamboundDisciple_BlessingOfTheGolem_EDR_847p,
	CardIds.LunarwingMessenger_BlessingOfTheMoon_EDR_449p,
];

export const getDynamicRelatedCardIds = (
	cardId: string,
	allCards: AllCardsService,
	options: {
		format: GameFormat;
		gameType: GameType;
		currentClass: string;
		deckState: DeckState;
		gameState: GameState;
	},
): readonly string[] | { override: true; cards: readonly string[] } => {
	switch (cardId) {
		case CardIds.DreamplannerZephrys_ExtravagantTourToken_WORK_027t2:
		case CardIds.DreamplannerZephrys_HecticTourToken_WORK_027t3:
		case CardIds.DreamplannerZephrys_ModestTourToken_WORK_027t1:
		case CardIds.HopefulDryad_EDR_001:
			return allCards.getCard(cardId).relatedCardDbfIds?.map((dbfId) => allCards.getCard(dbfId).id) ?? [];
		case CardIds.FlutterwingGuardian_EDR_800:
		case CardIds.BitterbloomKnight_EDR_852:
			return {
				override: true,
				cards: IMBUED_HERO_POWERS.filter((hp) => allCards.getCard(hp).classes?.includes(options.currentClass)),
			};
		case CardIds.FinalFrontier_GDB_857:
			return filterCards(
				allCards,
				{ ...options, format: GameFormat.FT_WILD },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, options.gameType) &&
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					c?.cost === 10,
			);
		case CardIds.WhackAGnoll_MIS_700:
			return filterCards(
				allCards,
				{ ...options, format: GameFormat.FT_WILD },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, options.gameType) &&
					c?.type?.toUpperCase() === CardType[CardType.WEAPON] &&
					c.classes?.includes(CardClass[CardClass.PALADIN]),
			);
		case CardIds.ErodedSediment_WW_428:
			return filterCards(
				allCards,
				{ ...options, format: GameFormat.FT_WILD },
				cardId,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, options.gameType) &&
					hasCorrectTribe(c, Race.ELEMENTAL),
			);
		case CardIds.WaveOfNostalgia_MIS_701:
			return filterCards(
				allCards,
				{ ...options, format: GameFormat.FT_WILD },
				cardId,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, options.gameType) &&
					c?.rarity?.toUpperCase() === CardRarity[CardRarity.LEGENDARY],
			);
		case CardIds.Botface_TOY_906:
			// TODO: Fix these minis not showing up properly (are minis tagged properly?)
			// TODO: Confirm if Botface can generate Boom Wrench - if not, add minion tag
			return filterCards(
				allCards,
				{ ...options, format: GameFormat.FT_WILD },
				cardId,
				(c) => 
					c?.mechanics?.includes(GameTag[GameTag.MINI]),
			);
	
		case CardIds.EmergencyMeeting_GDB_119:
			return [
				...CREWMATES,
				...filterCards(
					allCards,
					options,
					cardId,
					(c) =>
						c?.type?.toUpperCase() === CardType[CardType.MINION] &&
						(c?.cost ?? 0) <= 3 &&
						hasCorrectTribe(c, Race.DEMON),
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
					.sort(
						(a, b) =>
							(a.cost ?? 0) - (b.cost ?? 0) ||
							a.classes?.[0]?.localeCompare(b.classes?.[0] ?? '') ||
							a.name.localeCompare(b.name),
					)
					.map((c) => c.id)
			);
	}

	const filters = getDynamicFilters(cardId, allCards, options);
	if (filters == null) {
		return [];
	}
	if (Array.isArray(filters)) {
		return filterCards(allCards, options, cardId, ...filters);
	} else {
		return filterCards(allCards, options, cardId, filters);
	}
};

const getDynamicFilters = (
	cardId: string,
	allCards: AllCardsService,
	options: {
		format: GameFormat;
		gameType: GameType;
		currentClass: string;
		deckState: DeckState;
		gameState: GameState;
	},
): ((ref: ReferenceCard) => boolean | undefined) | ((ref: ReferenceCard) => boolean)[] | undefined => {
	switch (cardId) {
		case CardIds.BlessingOfTheDragon_EmeraldPortalToken_EDR_445pt3:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.DRAGON) &&
				(c?.cost ?? 0) === Math.min(
					10,
					getPlayerOrOpponent(options.deckState, options.gameState)?.PlayerEntity?.tags?.find(
						(t) => t.Name === GameTag.IMBUES_THIS_GAME,
					)?.Value ?? 0,
				);
		case CardIds.ShiftySophomore:
			return (c) =>
				c.mechanics?.includes(GameTag[GameTag.COMBO]);
		case CardIds.BloodsailRecruiter_VAC_430:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.PIRATE);
		case CardIds.ObserverOfMysteries_TOY_520:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c?.mechanics?.includes(GameTag[GameTag.SECRET]);
		case CardIds.DelayedProduct_MIS_305:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(c?.cost ?? 0) >= 8 &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.CraftersAura_TOY_808:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(c?.cost ?? 0) === 6;
		case CardIds.SpotTheDifference_TOY_374:
		case CardIds.IncredibleValue_TOY_046:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(c?.cost ?? 0) === 4 &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.HiddenObjects_TOY_037:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] && 
				c?.mechanics?.includes(GameTag[GameTag.SECRET]) &&
				c.classes?.includes(CardClass[CardClass.MAGE]);
		case CardIds.WindowShopper_TOY_652:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.DEMON) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.BlindBox_TOY_643:
			return (c) =>
				c?.type.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.DEMON);
		case CardIds.SilkStitching_TOY_822:
			return (c) =>
				c?.type.toUpperCase() === CardType[CardType.SPELL] &&
				(c?.cost ?? 0) <= 4 &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.ChaoticTendril_YOG_514:
			return (c) =>
				c?.type.toUpperCase() === CardType[CardType.SPELL] &&
				(c?.cost ?? 0) === options.deckState.chaoticTendrilsPlayedThisMatch + 1;
		case CardIds.RunesOfDarkness_YOG_511:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.WEAPON] &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.OnceUponATime_TOY_506:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(hasCorrectTribe(c, Race.BEAST) || 
					hasCorrectTribe(c, Race.DRAGON) || 
					hasCorrectTribe(c, Race.ELEMENTAL) || 
					hasCorrectTribe(c, Race.MURLOC)) &&
				(c?.cost ?? 0) == 3;
		case CardIds.PartnerAssignment:
			return (c) => 
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.BEAST) &&
				((c?.cost ?? 0) === 2 || (c?.cost ?? 0) == 3);
		case CardIds.FoolsGold_DEEP_022:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(hasCorrectTribe(c, Race.PIRATE) || hasCorrectTribe(c, Race.ELEMENTAL)) &&
				fromAnotherClass(c, options.currentClass);	
		case CardIds.RitualOfTheNewMoon_EDR_461:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				((c?.cost ?? 0) === 6 || (c?.cost ?? 0) == 3);
		
		case CardIds.GorillabotA3Core:	
		case CardIds.GorillabotA3:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.MECH);
		case CardIds.MismatchedFossils_DEEP_001:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(hasCorrectTribe(c, Race.BEAST) || 
					hasCorrectTribe(c, Race.UNDEAD));
		case CardIds.ObsidianRevenant_DEEP_005:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				c?.mechanics?.includes(GameTag[GameTag.DEATHRATTLE]) &&
				(c?.cost ?? 0) <= 3;
		case CardIds.Mothership_TSC_645:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.MECH) &&
				(c?.cost ?? 0) <= 3;
		case CardIds.OasisOutlaws_WW_404:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.NAGA) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.CactusConstruct_WW_818:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(c?.cost ?? 0) === 2 &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.SaddleUp_WW_812:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.BEAST) &&
				(c?.cost ?? 0) <= 3;
		case CardIds.ReliquaryResearcher_WW_432:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] && 
				c?.mechanics?.includes(GameTag[GameTag.SECRET]) &&
				c.classes?.includes(CardClass[CardClass.MAGE]);
		case CardIds.WishingWell_WW_415:
		case CardIds.SneedsOldShredder_CORE_GVG_114:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				c?.rarity?.toUpperCase() === CardRarity[CardRarity.LEGENDARY];
		case CardIds.MaruutStonebinder_DEEP_037:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.ELEMENTAL);
		case CardIds.WildernessPack_MIS_104:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.BEAST);		
		case CardIds.TeachersPet:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.BEAST) &&
				(c?.cost ?? 0) === 3;
		case CardIds.PackKodo:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(hasCorrectTribe(c, Race.BEAST) ||
					(c?.type?.toUpperCase() === CardType[CardType.SPELL] && 
						c?.mechanics?.includes(GameTag[GameTag.SECRET])) ||
					c?.type?.toUpperCase() === CardType[CardType.WEAPON]
				) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.SchoolTeacher:
			// TODO: Add nagaling token 
			return (c) => 
					(c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
					(c?.cost ?? 0) <= 3 &&
					canBeDiscoveredByClass(c, options.currentClass));
		case CardIds.EverythingMustGo_TOY_519:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(c?.cost ?? 0) === 4;
		case CardIds.AzsharanScroll:
		case CardIds.AzsharanScroll_SunkenScrollToken: 
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c?.classes?.includes(options.currentClass.toUpperCase()) &&
				(c?.spellSchool?.includes(SpellSchool[SpellSchool.FIRE]) || 
					c?.spellSchool?.includes(SpellSchool[SpellSchool.FROST]) ||
					c?.spellSchool?.includes(SpellSchool[SpellSchool.NATURE]))
		case CardIds.Peon_BAR_022:
		case CardIds.OnyxMagescribe:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c?.classes?.includes(options.currentClass.toUpperCase());
		case CardIds.Jackpot:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				(c?.cost ?? 0) >= 5 &&
				fromAnotherClass(c, options.currentClass);
		case CardIds.SunkenSweeper:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.MECH);
		case CardIds.SubmergedSpacerock:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c?.spellSchool?.includes(SpellSchool[SpellSchool.ARCANE]) &&
				c.classes?.includes(CardClass[CardClass.MAGE]);
		case CardIds.SavoryDeviateDelight:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(hasCorrectTribe(c, Race.PIRATE) ||
					c.mechanics?.includes(GameTag[GameTag.STEALTH]));
		case CardIds.PlaguedProtodrake:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(c?.cost ?? 0) === 7;
		case CardIds.ExarchHataaru_GDB_136:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.InstructorFireheart:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				(c.cost ?? 0) >= 1 &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.TrickTotem_SCH_537:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				(c.cost ?? 0) <= 3
		case CardIds.WandThief_SCH_350:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c.classes?.includes(CardClass[CardClass.MAGE])
		case CardIds.SunsetVolley_WW_427:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(c?.cost ?? 0) === 10;
		case CardIds.TrainingSession_NX2_029:
		case CardIds.HikingTrail_VAC_517:
		case CardIds.StonehillDefender_Core_UNG_072:
		case CardIds.IKnowAGuy_CORE_WON_350:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasMechanic(c, GameTag.TAUNT) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.StandardizedPack_MIS_705:
		case CardIds.InFormation:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasMechanic(c, GameTag.TAUNT);
		case CardIds.SmokeBomb_FIR_920:
			return (c) =>
				canBeDiscoveredByClass(c, options.currentClass) &&
				c.type?.toUpperCase() === CardType[CardType.MINION] &&
				(c.mechanics?.includes(GameTag[GameTag.COMBO]) ||
					c.mechanics?.includes(GameTag[GameTag.BATTLECRY]) ||
					c.mechanics?.includes(GameTag[GameTag.STEALTH]));
		case CardIds.ShadowflameSuffusion_FIR_939:
			return (c) =>
				c.type?.toUpperCase() === CardType[CardType.MINION] &&
				c.classes?.includes(CardClass[CardClass.WARRIOR]);
		case CardIds.AmbassadorFaelin_TSC_067:
			return (c) =>
				c.type?.toUpperCase() === CardType[CardType.MINION] && c.mechanics?.includes(GameTag[GameTag.COLOSSAL]);
		case CardIds.FyrakkTheBlazing_FIR_959:
			return (c) =>
				c.spellSchool?.toUpperCase() === SpellSchool[SpellSchool.FIRE] &&
				c.type?.toUpperCase() === CardType[CardType.SPELL];
		case CardIds.Scorchreaver_FIR_952:
			return (c) =>
				canBeDiscoveredByClass(c, options.currentClass) &&
				c.spellSchool === SpellSchool[SpellSchool.FEL] &&
				c.type?.toUpperCase() === CardType[CardType.SPELL];
		case CardIds.ShadowflameStalker_FIR_924:
			return (c) => hasCorrectTribe(c, Race.DEMON) && canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.EmberscarredWhelp_FIR_927:
			return (c) => canBeDiscoveredByClass(c, options.currentClass) && c.cost === 5;
		case CardIds.Cremate_FIR_900:
			return (c) => c.type?.toUpperCase() === CardType[CardType.MINION] && canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.InfernoHerald_FIR_913:
			return (c) => hasCorrectTribe(c, Race.ELEMENTAL);
		case CardIds.FarmHand_WW_358:
		case CardIds.ToysnatchingGeist_MIS_006:
		case CardIds.ToysnatchingGeist_ToysnatchingGeistToken_MIS_006t:
		case CardIds.RiteOfAtrocity_EDR_811:
			return (c) => hasCorrectTribe(c, Race.UNDEAD) && canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.SweetenedSnowflurry_TOY_307:
		case CardIds.SweetenedSnowflurry_SweetenedSnowflurryToken_TOY_307t:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] && c.spellSchool === SpellSchool[SpellSchool.FROST];
		case CardIds.SparkOfLife_EDR_872:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				(c.classes?.includes(CardClass[CardClass.MAGE]) || c.classes?.includes(CardClass[CardClass.DRUID]))
		case CardIds.BabblingBookcase_CORE_EDR_001:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] && c.classes?.includes(CardClass[CardClass.MAGE]);
		case CardIds.GiftOfFire_EDR_872A:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c.classes?.includes(CardClass[CardClass.MAGE]) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.GiftOfNature_EDR_872B:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c.classes?.includes(CardClass[CardClass.DRUID]) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.ForbiddenShrine_EDR_520:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c.cost === Math.min(10, options.deckState.manaLeft ?? 0);
		case CardIds.Alarashi_EDR_493:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.DEMON);
		case CardIds.AvantGardening_EDR_488:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasMechanic(c, GameTag.DEATHRATTLE) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.Jumpscare_EDR_882:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.DEMON) &&
				(c.cost ?? 0) >= 5 &&
				canBeDiscoveredByClass(c, options.currentClass);
		
		case CardIds.Photosynthesis_EDR_848:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] && c.classes?.includes(CardClass[CardClass.DRUID]);
		
		case CardIds.Symbiosis_EDR_273:
			return (c) => hasMechanic(c, GameTag.CHOOSE_ONE) && fromAnotherClass(c, options.currentClass);
		case CardIds.DaydreamingPixie_EDR_530:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c?.spellSchool === SpellSchool[SpellSchool.NATURE];
		case CardIds.HornOfPlenty_EDR_270:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c?.spellSchool === SpellSchool[SpellSchool.NATURE] &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.DragonTales_WW_821:
		case CardIds.Ysondre_EDR_465:
		case CardIds.SelenicDrake_EDR_462:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.DRAGON);
		case CardIds.Howdyfin_WW_333:	
		case CardIds.GnawingGreenfin_EDR_999:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.MURLOC);
		case CardIds.TreacherousTormentor_EDR_102:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				c?.rarity?.toUpperCase() === CardRarity[CardRarity.LEGENDARY] &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.FlintFirearm_WW_379:
			return (c) => c?.mechanics?.includes(GameTag[GameTag.QUICKDRAW]);
		case CardIds.StickUp_WW_411:
			return (c) =>
				c?.mechanics?.includes(GameTag[GameTag.QUICKDRAW]) && fromAnotherClass(c, options.currentClass);
		case CardIds.LifebindersGift:
		case CardIds.LifebindersBloom:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c?.spellSchool === SpellSchool[SpellSchool.NATURE];
		case CardIds.CruiseCaptainLora_VAC_506:
		case CardIds.TravelAgent_VAC_438:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.LOCATION];
		case CardIds.TravelSecurity_WORK_010:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && c?.cost === 8;
		case CardIds.CreatureOfMadness_EDR_105:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				c?.cost === 3 &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.DemonicDeal_WORK_014:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				(c.cost ?? 0) >= 5 &&
				hasCorrectTribe(c, Race.DEMON);
		
		case CardIds.AssimilatingBlight_GDB_478:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				c?.cost === 3 &&
				canBeDiscoveredByClass(c, options.currentClass) &&
				hasMechanic(c, GameTag.DEATHRATTLE);
		
		case CardIds.Blasteroid_GDB_303:
		case CardIds.Supernova_GDB_301:
			return (c) =>
				c?.id !== cardId &&
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c?.spellSchool?.includes(SpellSchool[SpellSchool.FIRE]);
		case CardIds.ResonanceCoil_SC_760:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] && c?.mechanics?.includes(GameTag[GameTag.PROTOSS]);
		case CardIds.Mothership_SC_762:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				c?.mechanics?.includes(GameTag[GameTag.PROTOSS]);
		case CardIds.BroodQueen_LarvaToken_SC_003t:
		case CardIds.BroodQueen_SC_003:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				c?.mechanics?.includes(GameTag[GameTag.ZERG]) &&
				c?.id !== CardIds.BroodQueen_SC_003;
		case CardIds.WaywardProbe_SC_500:
			return (c) => c?.mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE]);
		case CardIds.DetailedNotes_GDB_844:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.BEAST) &&
				canBeDiscoveredByClass(c, options.currentClass) &&
				(c.cost ?? 0) >= 5;

		// Random X Cost Minion(s)
		case CardIds.FirstContact_GDB_864:
		case CardIds.AegisOfLight_EDR_264:
		case CardIds.FirstDayOfSchool:
		case CardIds.ShimmerShot_DEEP_003:
		case CardIds.BuildingBlockGolem_MIS_314:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && c?.cost === 1;
		
		case CardIds.RayllaSandSculptor_VAC_424:
		case CardIds.TwilightInfluence_EDR_463:
		case CardIds.HarbingerOfTheBlighted_EDR_781:
		case CardIds.DistressSignal_GDB_883:
		case CardIds.MazeGuide:
		case CardIds.MazeGuide_CORE_REV_308:
		case CardIds.DwarfPlanet_GDB_233:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && c?.cost === 2;
		
		case CardIds.KureTheLightBeyond_GDB_442:
		case CardIds.LinedancePartner_WW_433:
		case CardIds.HiddenMeaning:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && c?.cost === 3;

		case CardIds.JandiceBarov_SCH_351:
		case CardIds.WardOfEarth_EDR_060:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && c.cost === 5;
		
		case CardIds.FirelandsPortalCore:
		case CardIds.FirelandsPortal:
		case CardIds.ChaosCreation_DEEP_031:
		case CardIds.RitualOfTheNewMoon_RitualOfTheFullMoonToken_EDR_461t:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && c.cost === 6; 

		case CardIds.ScarabKeychain_TOY_006:
			return (c) => canBeDiscoveredByClass(c, options.currentClass) && c?.cost === 2;
		case CardIds.ExarchOthaar_GDB_856:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c?.spellSchool?.includes(SpellSchool[SpellSchool.ARCANE]);
		case CardIds.HuddleUp_WORK_012:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.NAGA);
		case CardIds.HologramOperator_GDB_723:
		case CardIds.OrbitalSatellite_GDB_462:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.DRAENEI);
		case CardIds.RelentlessWrathguard_GDB_132:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.DEMON) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.AbductionRay_GDB_123:
			return (c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.DEMON);
		case CardIds.Nebula_GDB_479:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				c?.cost === 8 &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.Wandmaker:
		case CardIds.Wandmaker_CORE_SCH_160:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c?.cost === 1 &&
				c?.classes?.includes(options.currentClass.toUpperCase());
		case CardIds.PrimordialStudies_SCH_270:
			return [
				(c) => c?.id !== CardIds.Sif,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					hasMechanic(c, GameTag.SPELLPOWER) &&
					canBeDiscoveredByClass(c, options.currentClass),
			];
		case CardIds.CarrionStudies:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasMechanic(c, GameTag.DEATHRATTLE) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.AthleticStudies_SCH_237:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasMechanic(c, GameTag.RUSH) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.IllidariStudiesCore:
		case CardIds.IllidariStudies_YOP_001:
			return (c) => hasMechanic(c, GameTag.OUTCAST) && canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.NatureStudies_SCH_333:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] && canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.DemonicStudies:
		case CardIds.DemonicStudies_CORE_SCH_158:
		case CardIds.DemonicDynamics:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.DEMON) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.DraconicStudies:
		case CardIds.Rheastrasza_WW_824:
		case CardIds.NetherspiteHistorian:
		case CardIds.Darkrider_EDR_456:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCorrectTribe(c, Race.DRAGON) &&
				canBeDiscoveredByClass(c, options.currentClass);
		case CardIds.GalacticCrusader_GDB_862:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
				c.spellSchool?.includes(SpellSchool[SpellSchool.HOLY]);
		case CardIds.ScroungingShipwright_GDB_876:
		case CardIds.StarshipSchematic_GDB_102:
			return (c) =>
				c?.mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE]) && fromAnotherClass(c, options.currentClass);
		case CardIds.LuckyComet_GDB_873:
			return (c) =>
				c?.type?.toUpperCase() === CardType[CardType.MINION] &&
				c?.mechanics?.includes(GameTag[GameTag.COMBO]) &&
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

let baseCards: readonly ReferenceCard[] = [];

const filterCards = (
	allCards: AllCardsService,
	options: {
		format: GameFormat;
		gameType: GameType;
	},
	sourceCardId: string,
	...filters: ((ref: ReferenceCard) => boolean | undefined)[]
) => {
	if (baseCards.length === 0) {
		baseCards = allCards
			.getCards()
			.filter((c) => c.collectible)
			// https://hearthstone.wiki.gg/wiki/Special:RunQuery/WikiBanPool?pfRunQueryFormName=WikiBanPool&wpRunQuery=Run%2Bquery&WikiBanPool_form_only%5BoriginalPage%5D=Nebula&WikiBanPool_form_only%5Bid%5D=13&WikiBanPool_form_only%5BgameMode%5D=1
			.filter((c) => !c.mechanics?.includes(GameTag[GameTag.TITAN]))
			.filter((c) => !BAN_LIST.includes(c.id as CardIds))
			// https://hearthstone.wiki.gg/wiki/Special:RunQuery/WikiBanPool?pfRunQueryFormName=WikiBanPool&wpRunQuery=Run%2Bquery&WikiBanPool_form_only%5BoriginalPage%5D=Nebula&WikiBanPool_form_only%5Bid%5D=6&WikiBanPool_form_only%5BgameMode%5D=1
			.filter(
				(c) =>
					!c.mechanics?.includes(GameTag[GameTag.QUEST]) &&
					!c.mechanics?.includes(GameTag[GameTag.QUESTLINE]) &&
					!c.mechanics?.includes(GameTag[GameTag.QUESTLINE_PART]),
			)
			.filter((c) => !c.mechanics?.includes(GameTag[GameTag.COLOSSAL]))
			.filter((c) => !hasThreeRunes(c))
			.sort(
				(a, b) =>
					(a.cost ?? 0) - (b.cost ?? 0) ||
					a.classes?.[0]?.localeCompare(b.classes?.[0] ?? '') ||
					a.name.localeCompare(b.name),
			);
	}
	return baseCards
		.filter((c) => (!!c.set ? isValidSet(c.set.toLowerCase() as SetId, options.format, options.gameType) : false))
		.filter((c) => filters.every((f) => f(c)))
		.filter((c) => !sourceCardId || c.id !== sourceCardId)
		.map((c) => c.id);
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

const canBeDiscoveredByClass = (card: ReferenceCard, currentClass: string): boolean => {
	// Missing some info from the context, so we avoid recomputing the list of cards because it is cached
	if (!currentClass?.length) {
		return false;
	}
	if (!card.classes?.length) {
		return true;
	}
	return card.classes.includes(currentClass.toUpperCase()) || card.classes.includes(CardClass[CardClass.NEUTRAL]);
};

const fromAnotherClass = (card: ReferenceCard, currentClass: string): boolean => {
	return (
		!card?.classes?.includes(CardClass[CardClass.NEUTRAL]) && !card?.classes?.includes(currentClass?.toUpperCase())
	);
};



const getPlayerOrOpponent = (deckState: DeckState, gameState: GameState): PlayerGameState | undefined => {
	return deckState.isOpponent
		? gameState.fullGameState?.Opponent
		: gameState.fullGameState?.Player;
};


export const hasOverride = (
	result: readonly string[] | { override: true; cards: readonly string[] },
): result is {
	override: true;
	cards: readonly string[];
} => {
	return (result as { override: true; cards: readonly string[] })?.override;
};
