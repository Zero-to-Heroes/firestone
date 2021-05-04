import { BoosterType, CardIds, GameType } from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/retrieve-pack-stats';
import { capitalizeEachWord } from './utils';

export const CARDS_VERSION = '81706-1';

export const classes = [
	'demonhunter',
	'druid',
	'hunter',
	'mage',
	'paladin',
	'priest',
	'rogue',
	'shaman',
	'warrior',
	'warlock',
];

export const formatClass = (playerClass: string): string => {
	let update = playerClass?.toLowerCase();
	if (playerClass === 'demonhunter') {
		update = 'demon hunter';
	}
	return capitalizeEachWord(update);
};

export const globalEffectCards = [
	CardIds.Collectible.Druid.Embiggen,
	CardIds.Collectible.Druid.CelestialAlignment,
	CardIds.Collectible.Druid.SurvivalOfTheFittest,
	CardIds.Collectible.Hunter.ShandoWildclaw, // TODO: only show the effect if the "beast in your deck +1/+1 option, is chosen"
	CardIds.Collectible.Mage.DeckOfLunacy,
	CardIds.Collectible.Mage.LunasPocketGalaxy,
	CardIds.Collectible.Mage.IncantersFlow,
	CardIds.NonCollectible.Mage.InfiniteArcane,
	CardIds.Collectible.Mage.Wildfire,
	CardIds.Collectible.Neutral.FrizzKindleroost,
	CardIds.Collectible.Neutral.LorekeeperPolkelt,
	CardIds.Collectible.Neutral.PrinceKeleseth,
	CardIds.Collectible.Neutral.WyrmrestPurifier,
	CardIds.Collectible.Paladin.AldorAttendant,
	CardIds.Collectible.Paladin.AldorTruthseeker,
	CardIds.NonCollectible.Paladin.HumbleBlessings,
	CardIds.Collectible.Paladin.LothraxionTheRedeemed,
	CardIds.NonCollectible.Paladin.MenAtArms,
	CardIds.NonCollectible.Paladin.RadiantLightspawn2,
	CardIds.Collectible.Priest.ArchbishopBenedictus,
	CardIds.Collectible.Priest.DarkInquisitorXanesh,
	CardIds.Collectible.Priest.LadyInWhite,
	CardIds.Collectible.Shaman.GrandTotemEysor, // TODO: count the number of times the effect triggered, not the card played
	CardIds.Collectible.Warlock.DarkPharaohTekahn,
	CardIds.Collectible.Warlock.DeckOfChaos,
	CardIds.Collectible.Warlock.NeeruFireblade,
	CardIds.Collectible.Warlock.RenounceDarkness,
	CardIds.NonCollectible.Neutral.ReductomaraToken,
	CardIds.NonCollectible.Neutral.UpgradedPackMule,
	CardIds.NonCollectible.Paladin.LordaeronAttendant,
	CardIds.NonCollectible.Rogue.TheCavernsBelow_CrystalCoreTokenUNGORO,
];

export const cardsRevealedWhenDrawn = [
	CardIds.NonCollectible.Druid.YseraUnleashed_DreamPortalToken,
	CardIds.NonCollectible.Mage.DeckofWonders_ScrollOfWonderToken,
	CardIds.NonCollectible.Neutral.AncientShade_AncientCurseToken,
	CardIds.NonCollectible.Neutral.Chromie_BattleForMountHyjalToken,
	CardIds.NonCollectible.Neutral.Chromie_CullingOfStratholmeToken,
	CardIds.NonCollectible.Neutral.Chromie_EscapeFromDurnholdeToken,
	CardIds.NonCollectible.Neutral.Chromie_OpeningTheDarkPortalToken,
	CardIds.NonCollectible.Neutral.FlyBy_KadoomBotToken,
	CardIds.NonCollectible.Neutral.HakkartheSoulflayer_CorruptedBloodToken,
	CardIds.NonCollectible.Neutral.ImprovisedExplosive,
	CardIds.NonCollectible.Neutral.PortalKeeper_FelhoundPortalToken,
	CardIds.NonCollectible.Neutral.SeaforiumBomber_BombToken,
	CardIds.NonCollectible.Neutral.SandTrap,
	CardIds.NonCollectible.Neutral.TwistPlagueofMurlocs_SurpriseMurlocsToken,
	CardIds.NonCollectible.Neutral.TheDarkness_DarknessCandleToken,
	CardIds.NonCollectible.Rogue.BeneaththeGrounds_NerubianAmbushToken,
	CardIds.NonCollectible.Rogue.FaldoreiStrider_SpiderAmbushEnchantment,
	CardIds.NonCollectible.Rogue.ShadowofDeath_ShadowToken,
	CardIds.NonCollectible.Rogue.TicketMaster_TicketsToken,
	CardIds.NonCollectible.Rogue.Waxadred_WaxadredsCandleToken,
	CardIds.NonCollectible.Warlock.SchoolSpirits_SoulFragmentToken,
	CardIds.NonCollectible.Warrior.ImprovisedExplosiveTavernBrawl,
	CardIds.NonCollectible.Warrior.IronJuggernaut_BurrowingMineToken,
];

export const forcedHiddenCardCreators = [
	CardIds.NonCollectible.Neutral.MaskOfMimicryLOOTAPALOOZA,
	CardIds.NonCollectible.Neutral.MaskOfMimicryTavernBrawl,
];

export const publicCardCreators = [
	CardIds.Collectible.Demonhunter.VengefulSpirit,
	CardIds.Collectible.Druid.FungalFortunes, // tested
	CardIds.Collectible.Druid.JuicyPsychmelon, // tested
	CardIds.Collectible.Druid.LunarVisions, // tested
	CardIds.Collectible.Druid.PredatoryInstincts, // tested
	CardIds.Collectible.Druid.GuessTheWeight,
	CardIds.Collectible.Hunter.ArcaneFletcher, // tested
	CardIds.Collectible.Hunter.BarakKodobane,
	CardIds.Collectible.Hunter.CallPet, // tested
	CardIds.Collectible.Hunter.DivingGryphon, // tested
	CardIds.Collectible.Hunter.KingsElekk,
	CardIds.Collectible.Hunter.MastersCall, // tested
	CardIds.Collectible.Hunter.PackKodo,
	CardIds.Collectible.Hunter.ScavengersIngenuity, // tested
	CardIds.Collectible.Hunter.TolvirWarden, // tested
	CardIds.Collectible.Hunter.Ursatron, // tested
	CardIds.Collectible.Hunter.WarsongWrangler,
	CardIds.Collectible.Mage.AncientMysteries, // tested
	CardIds.Collectible.Mage.Arcanologist, // tested
	CardIds.Collectible.Mage.ArchmageArugal, // tested
	CardIds.Collectible.Mage.BookOfSpecters, // tested
	CardIds.Collectible.Mage.ElementalAllies, // tested
	CardIds.Collectible.Mage.RavenFamiliar,
	CardIds.Collectible.Mage.Starscryer, // tested
	CardIds.Collectible.Paladin.CallToAdventure, // tested
	CardIds.Collectible.Paladin.Crystology,
	CardIds.Collectible.Paladin.HowlingCommander,
	CardIds.Collectible.Paladin.KnightOfAnointment,
	CardIds.Collectible.Paladin.NorthwatchCommander,
	CardIds.Collectible.Paladin.PrismaticLens,
	CardIds.Collectible.Paladin.SalhetsPride, // tested
	CardIds.Collectible.Paladin.SmallTimeRecruits,
	CardIds.Collectible.Priest.BwonsamdiTheDead,
	CardIds.Collectible.Priest.DeadRinger,
	CardIds.Collectible.Priest.GhuunTheBloodGod,
	CardIds.NonCollectible.Priest.Insight_InsightToken,
	CardIds.Collectible.Priest.ThriveInTheShadowsCore,
	CardIds.Collectible.Rogue.CavernShinyfinder,
	CardIds.Collectible.Rogue.CursedCastaway,
	CardIds.Collectible.Rogue.ElvenMinstrel,
	CardIds.Collectible.Rogue.GalakrondTheNightmare,
	CardIds.NonCollectible.Rogue.GalakrondtheNightmare_GalakrondTheApocalypseToken,
	CardIds.NonCollectible.Rogue.GalakrondtheNightmare_GalakrondAzerothsEndToken,
	CardIds.Collectible.Rogue.GrandEmpressShekzara,
	CardIds.Collectible.Rogue.NecriumApothecary,
	CardIds.Collectible.Rogue.RollTheBones,
	CardIds.Collectible.Rogue.RaidingParty,
	CardIds.Collectible.Rogue.Stowaway,
	CardIds.Collectible.Rogue.Swindle,
	CardIds.Collectible.Rogue.ThistleTea,
	CardIds.Collectible.Shaman.Bogshaper,
	CardIds.Collectible.Shaman.CagematchCustodian,
	CardIds.Collectible.Shaman.ElementaryReaction,
	CardIds.Collectible.Shaman.FarSight,
	CardIds.Collectible.Shaman.IceFishing,
	CardIds.Collectible.Shaman.SpiritOfTheFrog,
	CardIds.Collectible.Shaman.StormChaser,
	CardIds.Collectible.Warlock.FelLordBetrug,
	CardIds.Collectible.Warlock.FreeAdmission,
	CardIds.Collectible.Warlock.SenseDemons,
	CardIds.NonCollectible.Warlock.SupremeArchaeology_TomeOfOrigination,
	CardIds.Collectible.Warlock.TamsinRoame,
	CardIds.Collectible.Warrior.AkaliTheRhino,
	CardIds.Collectible.Warrior.Ancharrr,
	CardIds.Collectible.Warrior.CorsairCache,
	CardIds.Collectible.Warrior.ForgeOfSouls,
	CardIds.Collectible.Warrior.GalakrondTheUnbreakable,
	CardIds.NonCollectible.Warrior.GalakrondtheUnbreakable_GalakrondTheApocalypseToken,
	CardIds.NonCollectible.Warrior.GalakrondtheUnbreakable_GalakrondAzerothsEndToken,
	CardIds.Collectible.Warrior.StageDive,
	CardIds.Collectible.Warrior.TownCrier,
	CardIds.Collectible.Warrior.RingmasterWhatley,
	CardIds.Collectible.Warrior.VarianWrynn,
	CardIds.Collectible.Neutral.BrightEyedScout, // tested
	CardIds.Collectible.Neutral.CaptainsParrotLegacy,
	CardIds.Collectible.Neutral.CaptainsParrotVanilla,
	CardIds.Collectible.Neutral.ClawMachine,
	CardIds.Collectible.Neutral.CountessAshmore, // tested
	CardIds.Collectible.Neutral.Guidance,
	CardIds.Collectible.Neutral.JepettoJoybuzz, // tested
	CardIds.Collectible.Neutral.Kazakus,
	CardIds.Collectible.Neutral.KazakusGolemShaper,
	CardIds.Collectible.Neutral.KronxDragonhoof,
	CardIds.Collectible.Neutral.MurlocTastyfin, // tested
	CardIds.Collectible.Neutral.Mankrik, // tested
	CardIds.Collectible.Neutral.Peon,
	CardIds.Collectible.Neutral.PrimordialProtector,
	CardIds.Collectible.Neutral.Sandbinder,
	CardIds.Collectible.Neutral.SouthseaScoundrel,
	CardIds.Collectible.Neutral.Subject9, // tested
	CardIds.Collectible.Neutral.TaelanFordringCore,
	CardIds.Collectible.Neutral.TentacledMenace, // tested
	CardIds.Collectible.Neutral.TheCurator, // tested
	CardIds.Collectible.Neutral.UtgardeGrapplesniper, // tested
	CardIds.Collectible.Neutral.VenomousScorpid,
	CardIds.Collectible.Neutral.WitchwoodPiper, // tested
	CardIds.NonCollectible.Neutral.WondrousWand,
	CardIds.Collectible.Neutral.Wrathion, // tested
];

export const getGalakrondCardFor = (className: string, invokeCount: number): string => {
	switch (className) {
		case 'priest':
			if (invokeCount >= 4) {
				return CardIds.NonCollectible.Priest.GalakrondtheUnspeakable_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.NonCollectible.Priest.GalakrondtheUnspeakable_GalakrondTheApocalypseToken;
			}
			return CardIds.Collectible.Priest.GalakrondTheUnspeakable;
		case 'rogue':
			if (invokeCount >= 4) {
				return CardIds.NonCollectible.Rogue.GalakrondtheNightmare_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.NonCollectible.Rogue.GalakrondtheNightmare_GalakrondTheApocalypseToken;
			}
			return CardIds.Collectible.Rogue.GalakrondTheNightmare;
		case 'shaman':
			if (invokeCount >= 4) {
				return CardIds.NonCollectible.Shaman.GalakrondtheTempest_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.NonCollectible.Shaman.GalakrondtheTempest_GalakrondTheApocalypseToken;
			}
			return CardIds.Collectible.Shaman.GalakrondTheTempest;
		case 'warlock':
			if (invokeCount >= 4) {
				return CardIds.NonCollectible.Warlock.GalakrondtheWretched_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.NonCollectible.Warlock.GalakrondtheWretched_GalakrondTheApocalypseToken;
			}
			return CardIds.Collectible.Warlock.GalakrondTheWretched;
		case 'warrior':
			if (invokeCount >= 4) {
				return CardIds.NonCollectible.Warrior.GalakrondtheUnbreakable_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.NonCollectible.Warrior.GalakrondtheUnbreakable_GalakrondTheApocalypseToken;
			}
			return CardIds.Collectible.Warrior.GalakrondTheUnbreakable;
	}
	return CardIds.Collectible.Rogue.GalakrondTheNightmare;
};

export const defaultStartingHp = (gameType: GameType, heroCardId: string): number => {
	if ([GameType.GT_BATTLEGROUNDS, GameType.GT_BATTLEGROUNDS_FRIENDLY].includes(gameType)) {
		switch (heroCardId) {
			case CardIds.NonCollectible.Neutral.PatchwerkTavernBrawl2:
				return 55;
			default:
				return 40;
		}
	}
	return 30;
};

export const dustFor = (rarity: string): number => {
	switch (rarity?.toLowerCase()) {
		case 'legendary':
			return 400;
		case 'epic':
			return 100;
		case 'rare':
			return 20;
		default:
			return 5;
	}
};

export const dustForPremium = (rarity: string): number => {
	return 4 * dustFor(rarity?.toLowerCase());
};

export const dustToCraftFor = (rarity: string): number => {
	switch (rarity?.toLowerCase()) {
		case 'legendary':
			return 1600;
		case 'epic':
			return 400;
		case 'rare':
			return 100;
		default:
			return 40;
	}
};

export const dustToCraftForPremium = (rarity: string): number => {
	return 4 * dustToCraftFor(rarity?.toLowerCase());
};

export const boosterIdToSetId = (boosterId: BoosterType): string => {
	switch (boosterId) {
		case BoosterType.CLASSIC:
		case BoosterType.GOLDEN_CLASSIC_PACK:
			return 'expert1';
		case BoosterType.GOBLINS_VS_GNOMES:
			return 'gvg';
		case BoosterType.THE_GRAND_TOURNAMENT:
			return 'tgt';
		case BoosterType.OLD_GODS:
		case BoosterType.FIRST_PURCHASE_OLD:
			return 'og';
		case BoosterType.MEAN_STREETS:
			return 'gangs';
		case BoosterType.UNGORO:
			return 'ungoro';
		case BoosterType.FROZEN_THRONE:
			return 'icecrown';
		case BoosterType.KOBOLDS_AND_CATACOMBS:
			return 'lootapalooza';
		case BoosterType.WITCHWOOD:
			return 'gilneas';
		case BoosterType.THE_BOOMSDAY_PROJECT:
			return 'boomsday';
		case BoosterType.RASTAKHANS_RUMBLE:
			return 'troll';
		case BoosterType.DALARAN:
			return 'dalaran';
		case BoosterType.ULDUM:
			return 'uldum';
		case BoosterType.DRAGONS:
			return 'dragons';
		case BoosterType.BLACK_TEMPLE:
			return 'black_temple';
		case BoosterType.SCHOLOMANCE:
		case BoosterType.GOLDEN_SCHOLOMANCE:
			return 'scholomance';
		case BoosterType.DARKMOON_FAIRE:
		case BoosterType.GOLDEN_DARKMOON_FAIRE:
			return 'darkmoon_faire';
		case BoosterType.THE_BARRENS:
		case BoosterType.GOLDEN_THE_BARRENS:
			return 'the_barrens';
		case BoosterType.STANDARD_HUNTER:
		case BoosterType.STANDARD_MAGE:
		case BoosterType.STANDARD_PALADIN:
		case BoosterType.STANDARD_WARRIOR:
		case BoosterType.STANDARD_PRIEST:
		case BoosterType.STANDARD_ROGUE:
		case BoosterType.SIGNUP_INCENTIVE:
		case BoosterType.MAMMOTH_BUNDLE:
		case BoosterType.FIRST_PURCHASE:
		case BoosterType.YEAR_OF_DRAGON:
		case BoosterType.YEAR_OF_PHOENIX:
		default:
			console.warn('unsupported booster type', boosterId);
			return null;
	}
};

export const getDefaultBoosterIdForSetId = (setId: string): BoosterType => {
	switch (setId) {
		case 'expert1':
			return BoosterType.CLASSIC;
		case 'gvg':
			return BoosterType.GOBLINS_VS_GNOMES;
		case 'tgt':
			return BoosterType.THE_GRAND_TOURNAMENT;
		case 'og':
			return BoosterType.OLD_GODS;
		case 'gangs':
			return BoosterType.MEAN_STREETS;
		case 'ungoro':
			return BoosterType.UNGORO;
		case 'icecrown':
			return BoosterType.FROZEN_THRONE;
		case 'lootapalooza':
			return BoosterType.KOBOLDS_AND_CATACOMBS;
		case 'gilneas':
			return BoosterType.WITCHWOOD;
		case 'boomsday':
			return BoosterType.THE_BOOMSDAY_PROJECT;
		case 'troll':
			return BoosterType.RASTAKHANS_RUMBLE;
		case 'dalaran':
			return BoosterType.DALARAN;
		case 'uldum':
			return BoosterType.ULDUM;
		case 'dragons':
			return BoosterType.DRAGONS;
		case 'black_temple':
			return BoosterType.BLACK_TEMPLE;
		case 'scholomance':
			return BoosterType.SCHOLOMANCE;
		case 'darkmoon_faire':
		case 'darkmoon_races':
			return BoosterType.DARKMOON_FAIRE;
		case 'the_barrens':
			return BoosterType.THE_BARRENS;
		default:
			console.warn('no default booster type for set id', setId);
			return null;
	}
};

export const boosterIdToBoosterName = (boosterId: BoosterType): string => {
	switch (boosterId) {
		case BoosterType.CLASSIC:
			return 'Classic';
		case BoosterType.GOLDEN_CLASSIC_PACK:
			return 'Golden Classic';
		case BoosterType.GOBLINS_VS_GNOMES:
			return 'Goblins vs Gnomes';
		case BoosterType.THE_GRAND_TOURNAMENT:
			return 'The Grand Tournament';
		case BoosterType.OLD_GODS:
		case BoosterType.FIRST_PURCHASE_OLD:
			return 'Whispers of the Old Gods';
		case BoosterType.MEAN_STREETS:
			return 'Mean Streets of Gadgetzan';
		case BoosterType.UNGORO:
			return "Return to Un'Goro";
		case BoosterType.FROZEN_THRONE:
			return 'Knights of the Frozen Throne';
		case BoosterType.KOBOLDS_AND_CATACOMBS:
			return 'Kobolds and Catacombs';
		case BoosterType.WITCHWOOD:
			return 'The Witchwood';
		case BoosterType.THE_BOOMSDAY_PROJECT:
			return 'The Boomsday Project';
		case BoosterType.RASTAKHANS_RUMBLE:
			return "Rastakhan's Rumble";
		case BoosterType.DALARAN:
			return 'Rise of Shadows';
		case BoosterType.ULDUM:
			return 'Saviors of Uldum';
		case BoosterType.DRAGONS:
			return 'Descent of Dragons';
		case BoosterType.BLACK_TEMPLE:
			return 'Ashes of Outland';
		case BoosterType.SCHOLOMANCE:
			return 'Scholomance Academy';
		case BoosterType.GOLDEN_SCHOLOMANCE:
			return 'Golden Scholomance Academy';
		case BoosterType.DARKMOON_FAIRE:
			return 'Madness at the Darkmoon Faire';
		case BoosterType.GOLDEN_DARKMOON_FAIRE:
			return 'Golden Madness at the Darkmoon Faire';
		case BoosterType.THE_BARRENS:
			return 'Forged in the Barrens';
		case BoosterType.GOLDEN_THE_BARRENS:
			return 'Golden Forged in the Barrens';
		case BoosterType.STANDARD_HUNTER:
			return 'Standard Hunter';
		case BoosterType.STANDARD_MAGE:
			return 'Standard Mage';
		case BoosterType.STANDARD_PALADIN:
			return 'Standard Paladin';
		case BoosterType.STANDARD_WARRIOR:
			return 'Standard Warrior';
		case BoosterType.STANDARD_PRIEST:
			return 'Standard Priest';
		case BoosterType.STANDARD_ROGUE:
			return 'Standard Rogue';
		case BoosterType.MAMMOTH_BUNDLE:
			return 'Year of the Mammoth';
		case BoosterType.YEAR_OF_DRAGON:
			return 'Year of the Dragon';
		case BoosterType.SIGNUP_INCENTIVE:
			return 'First Signup';
		case BoosterType.FIRST_PURCHASE:
			return 'First Purchase';
		case BoosterType.YEAR_OF_PHOENIX:
			return 'Year of the Phoenix';
		default:
			console.warn('unsupported booster type', boosterId);
			return null;
	}
};

export const getPackDustValue = (pack: PackResult): number => {
	return pack.cards
		.map((card) => (card.cardType === 'GOLDEN' ? dustForPremium(card.cardRarity) : dustFor(card.cardRarity)))
		.reduce((a, b) => a + b, 0);
};

export const COUNTERSPELLS = [
	CardIds.Collectible.Mage.Counterspell,
	CardIds.Collectible.Mage.CounterspellCore,
	CardIds.Collectible.Mage.CounterspellVanilla,
	CardIds.Collectible.Paladin.OhMyYogg,
];

export const getDefaultHeroDbfIdForClass = (playerClass: string): number => {
	switch (playerClass?.toLowerCase()) {
		case 'demonhunter':
			return 56550;
		case 'druid':
			return 274;
		case 'hunter':
			return 31;
		case 'mage':
			return 637;
		case 'paladin':
			return 671;
		case 'priest':
			return 813;
		case 'rogue':
			return 930;
		case 'shaman':
			return 1066;
		case 'warlock':
			return 893;
		case 'warrior':
			return 7;
		default:
			console.warn('Could not normalize hero card id', playerClass);
			return 7;
	}
};
