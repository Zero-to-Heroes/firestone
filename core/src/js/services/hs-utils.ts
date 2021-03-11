import { CardIds, GameType } from '@firestone-hs/reference-data';
import { capitalizeEachWord } from './utils';

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
	CardIds.Collectible.Druid.SurvivalOfTheFittest,
	CardIds.Collectible.Hunter.ShandoWildclaw, // TODO: only show the effect if the "beast in your deck +1/+1 option, is chosen"
	CardIds.Collectible.Mage.DeckOfLunacy,
	CardIds.Collectible.Mage.LunasPocketGalaxy,
	CardIds.Collectible.Mage.IncantersFlow,
	CardIds.NonCollectible.Mage.InfiniteArcane,
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
	CardIds.Collectible.Druid.FungalFortunes, // tested
	CardIds.Collectible.Druid.JuicyPsychmelon, // tested
	CardIds.Collectible.Druid.LunarVisions, // tested
	CardIds.Collectible.Druid.PredatoryInstincts, // tested
	CardIds.Collectible.Druid.GuessTheWeight,
	CardIds.Collectible.Hunter.ArcaneFletcher, // tested
	CardIds.Collectible.Hunter.CallPet, // tested
	CardIds.Collectible.Hunter.DivingGryphon, // tested
	CardIds.Collectible.Hunter.KingsElekk,
	CardIds.Collectible.Hunter.MastersCall, // tested
	CardIds.Collectible.Hunter.ScavengersIngenuity, // tested
	CardIds.Collectible.Hunter.TolvirWarden, // tested
	CardIds.Collectible.Hunter.Ursatron, // tested
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
	CardIds.Collectible.Paladin.PrismaticLens,
	CardIds.Collectible.Paladin.SalhetsPride, // tested
	CardIds.Collectible.Paladin.SmallTimeRecruits,
	CardIds.Collectible.Priest.BwonsamdiTheDead,
	CardIds.Collectible.Priest.DeadRinger,
	CardIds.Collectible.Priest.GhuunTheBloodGod,
	CardIds.NonCollectible.Priest.Insight_InsightToken,
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
	CardIds.Collectible.Neutral.CaptainsParrot,
	CardIds.Collectible.Neutral.ClawMachine,
	CardIds.Collectible.Neutral.CountessAshmore, // tested
	CardIds.Collectible.Neutral.Guidance,
	CardIds.Collectible.Neutral.JepettoJoybuzz, // tested
	CardIds.Collectible.Neutral.KronxDragonhoof,
	CardIds.Collectible.Neutral.MurlocTastyfin, // tested
	CardIds.Collectible.Neutral.Sandbinder,
	CardIds.Collectible.Neutral.Subject9, // tested
	CardIds.Collectible.Neutral.TentacledMenace, // tested
	CardIds.Collectible.Neutral.TheCurator, // tested
	CardIds.Collectible.Neutral.UtgardeGrapplesniper, // tested
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
	switch (rarity) {
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
	return 4 * dustFor(rarity);
};
