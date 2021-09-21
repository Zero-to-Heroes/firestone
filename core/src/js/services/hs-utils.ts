import { BoosterType, CardIds, GameType } from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/retrieve-pack-stats';
import { capitalizeEachWord } from './utils';

export const CARDS_VERSION = '91456-8';

export const classes = [
	'demonhunter',
	'druid',
	'hunter',
	'mage',
	'paladin',
	'priest',
	'rogue',
	'shaman',
	'warlock',
	'warrior',
];
export const classesForPieChart = [
	'rogue',
	'druid',
	'hunter',
	'demonhunter',
	'paladin',
	'warrior',
	'warlock',
	'shaman',
	'mage',
	'priest',
];

export const formatClass = (playerClass: string): string => {
	let update = playerClass?.toLowerCase();
	if (update === 'demonhunter') {
		update = 'demon hunter';
	}
	return capitalizeEachWord(update);
};

export const colorForClass = (playerClass: string): string => {
	switch (playerClass) {
		case 'demonhunter':
			return '#8ECD64';
		case 'druid':
			return '#965F45';
		case 'hunter':
			return '#0A5945';
		case 'mage':
			return '#24A4C7';
		case 'paladin':
			return '#E3A81F';
		case 'priest':
			return '#8C98A7';
		case 'rogue':
			return '#5E6069';
		case 'shaman':
			return '#542A8A';
		case 'warrior':
			return '#CB3222';
		case 'warlock':
			return '#8A2A6A';
	}
};

export const globalEffectCards = [
	CardIds.DemonslayerKurtrusToken,
	CardIds.Embiggen,
	CardIds.CelestialAlignment,
	CardIds.SurvivalOfTheFittest2,
	CardIds.ShandoWildclaw, // TODO: only show the effect if the "beast in your deck +1/+1 option, is chosen"
	CardIds.DefendTheDwarvenDistrict_TavishMasterMarksmanToken,
	CardIds.DeckOfLunacy,
	CardIds.LunasPocketGalaxy,
	CardIds.IncantersFlow,
	CardIds.InfiniteArcaneTavernBrawlToken,
	CardIds.SorcerersGambit_ArcanistDawngraspToken,
	CardIds.Wildfire,
	CardIds.AldorAttendant,
	CardIds.AldorTruthseeker,
	CardIds.HumbleBlessingsTavernBrawl,
	CardIds.InvigoratingSermon,
	CardIds.LordaeronAttendantToken,
	CardIds.LothraxionTheRedeemed,
	CardIds.MenAtArmsTavernBrawlToken,
	CardIds.RadiantLightspawn,
	CardIds.RiseToTheOccasion_LightbornCarielToken,
	CardIds.ArchbishopBenedictus,
	CardIds.DarkInquisitorXanesh,
	CardIds.LadyInWhite,
	CardIds.TheCavernsBelow_CrystalCoreToken,
	// We handle the effects triggered instead of the card played
	// CardIds.GrandTotemEysor,
	CardIds.CommandTheElements_StormcallerBrukanToken,
	CardIds.GraniteForgeborn,
	CardIds.TheDemonSeed_BlightbornTamsinToken,
	CardIds.DarkPharaohTekahn,
	CardIds.DeckOfChaos,
	CardIds.NeeruFireblade1,
	CardIds.RenounceDarkness,

	CardIds.FrizzKindleroost,
	CardIds.HemetJungleHunter,
	CardIds.LadyPrestor,
	CardIds.LorekeeperPolkelt,
	CardIds.PrinceKeleseth,
	CardIds.SkulkingGeist,
	CardIds.ReductomaraToken,
	CardIds.UpgradedPackMule,
	CardIds.WyrmrestPurifier,
];

export const globalEffectTriggers = [
	{
		// There are actually several effects that are triggered (one for hand, deck and board)
		// We use only the deck one, as it's the one that is most likely to always be there
		// We could also create a brand new event on the parser side, but I'd rather first
		// see how other minions/effects will be handled in the future
		effectPrefab: 'DMF_GrandTotemAmikwe_Battlecry_DeckBoosh_Super.prefab',
		cardId: CardIds.GrandTotemEysor,
	},
];

export const globalEffectTriggersEffects = globalEffectTriggers.map((effect) => effect.effectPrefab);

export const globalEffectQuestlines = [
	{
		questStepCreated: CardIds.DefendTheDwarvenDistrict_TakeTheHighGroundToken,
		stepReward: CardIds.DefendTheDwarvenDistrict,
	},
	{
		questStepCreated: CardIds.DefendTheDwarvenDistrict_KnockEmDownToken,
		stepReward: CardIds.DefendTheDwarvenDistrict_TakeTheHighGroundToken,
	},
];

export const globalEffectQuestlinesTriggers = globalEffectQuestlines.map((effect) => effect.questStepCreated);

export const cardsRevealedWhenDrawn = [
	CardIds.YseraUnleashed_DreamPortalToken,
	CardIds.DeckOfWonders_ScrollOfWonderToken,
	CardIds.AncientShade_AncientCurseToken,
	CardIds.Chromie_BattleForMountHyjalToken,
	CardIds.Chromie_CullingOfStratholmeToken,
	CardIds.Chromie_EscapeFromDurnholdeToken,
	CardIds.Chromie_OpeningTheDarkPortalToken,
	CardIds.FlyBy_KadoomBotToken,
	CardIds.HakkarTheSoulflayer_CorruptedBloodToken,
	CardIds.Undermine_ImprovisedExplosiveToken,
	CardIds.PortalKeeper_FelhoundPortalToken,
	CardIds.SeaforiumBomber_BombToken,
	CardIds.SandTrap,
	CardIds.TwistPlagueOfMurlocs_SurpriseMurlocsToken,
	CardIds.TheDarkness_DarknessCandleToken,
	CardIds.BeneathTheGrounds_NerubianAmbushToken,
	CardIds.FaldoreiStrider_SpiderAmbush,
	CardIds.ShadowOfDeath_ShadowToken,
	CardIds.TicketMaster_TicketsToken,
	CardIds.Waxadred_WaxadredsCandleToken,
	CardIds.SchoolSpirits_SoulFragmentToken,
	CardIds.Undermine_ImprovisedExplosiveTavernBrawlToken,
	CardIds.IronJuggernaut_BurrowingMineToken,
];

export const forcedHiddenCardCreators = [CardIds.MaskOfMimicry, CardIds.MaskOfMimicryTavernBrawl];

export const forceHideInfoWhenDrawnInfluencers = [
	// Doesn't trigger Mankrik's Wife, so it probably behaves like Secret Passage
	CardIds.TrackingCore,
	CardIds.TrackingLegacy,
	CardIds.TrackingVanilla,
	// From what I've tested, Glide / Plot Twist seem to behave properly (cast when drawn
	// effects apply)
	CardIds.SecretPassage,
	// Cards that discover a card in your deck do count as drawing but cards that discover a copy do not.
	CardIds.ShadowVisions,
];

export const publicCardCreators = [
	CardIds.Felgorger,
	CardIds.VengefulSpirit2,
	CardIds.FungalFortunes,
	CardIds.JuicyPsychmelon,
	CardIds.LunarVisions,
	CardIds.PredatoryInstincts,
	CardIds.GuessTheWeight,
	CardIds.ArcaneFletcher,
	CardIds.BarakKodobane1,
	CardIds.CallPet,
	CardIds.DivingGryphon,
	CardIds.KingsElekk,
	CardIds.MastersCall,
	CardIds.PackKodo,
	CardIds.ScavengersIngenuity,
	CardIds.TolvirWarden,
	CardIds.Ursatron,
	CardIds.WarsongWrangler,
	CardIds.AncientMysteries,
	CardIds.Arcanologist,
	CardIds.ArcanologistCore,
	CardIds.ArchmageArugal,
	CardIds.BookOfSpecters,
	CardIds.ElementalAllies,
	CardIds.RavenFamiliar1,
	CardIds.SorcerersGambit,
	CardIds.SorcerersGambit_StallForTimeToken,
	CardIds.Starscryer,
	CardIds.AllianceBannerman,
	CardIds.CallToAdventure,
	CardIds.Crystology,
	CardIds.HowlingCommander,
	CardIds.KnightOfAnointment,
	CardIds.NorthwatchCommander,
	CardIds.PrismaticLens,
	CardIds.SalhetsPride,
	CardIds.SmallTimeRecruits,
	CardIds.BwonsamdiTheDead,
	CardIds.DeadRinger,
	CardIds.GhuunTheBloodGod,
	CardIds.Insight_InsightToken,
	CardIds.SeekGuidance,
	CardIds.SeekGuidance_DiscoverTheVoidShardToken,
	CardIds.ThriveInTheShadowsCore,
	CardIds.CavernShinyfinder,
	CardIds.CursedCastaway,
	CardIds.ElvenMinstrel,
	CardIds.GalakrondTheNightmare,
	CardIds.GalakrondTheNightmare_GalakrondTheApocalypseToken,
	CardIds.GalakrondTheNightmare_GalakrondAzerothsEndToken,
	CardIds.GrandEmpressShekzara,
	CardIds.NecriumApothecary,
	CardIds.RollTheBones,
	CardIds.RaidingParty,
	CardIds.SecretPassage_SecretEntranceEnchantment,
	CardIds.SketchyInformation,
	CardIds.Stowaway,
	CardIds.FindTheImposter_SpyOMaticToken,
	CardIds.Swindle,
	CardIds.ThistleTea,
	CardIds.Bogshaper,
	CardIds.CagematchCustodian,
	CardIds.ElementaryReaction,
	CardIds.PrimalDungeoneer,
	CardIds.FarSightLegacy,
	CardIds.FarSightVanilla,
	CardIds.IceFishing,
	CardIds.InvestmentOpportunity,
	CardIds.SpiritOfTheFrog,
	CardIds.CommandTheElements_StormcallerBrukanToken,
	CardIds.StormChaser,
	CardIds.FelLordBetrug1,
	CardIds.FreeAdmission,
	CardIds.SenseDemonsLegacy,
	CardIds.SenseDemonsVanilla1,
	CardIds.SupremeArchaeology_TomeOfOrigination,
	CardIds.TamsinRoame1,
	CardIds.AkaliTheRhino,
	CardIds.Ancharrr,
	CardIds.CorsairCache,
	CardIds.ForgeOfSouls,
	CardIds.GalakrondTheUnbreakable,
	CardIds.GalakrondTheUnbreakable_GalakrondTheApocalypseToken,
	CardIds.GalakrondTheUnbreakable_GalakrondAzerothsEndToken,
	CardIds.HarborScamp,
	CardIds.StageDive,
	CardIds.StageDive_StageDive,
	CardIds.TownCrier1,
	CardIds.RaidTheDocks,
	CardIds.RingmasterWhatley,
	CardIds.VarianWrynn1,
	CardIds.BrightEyedScout,
	CardIds.CaptainsParrotLegacy,
	CardIds.CaptainsParrotVanilla,
	CardIds.ClawMachine,
	CardIds.CountessAshmore,
	CardIds.GnomishExperimenter,
	CardIds.Guidance1,
	CardIds.JepettoJoybuzz,
	CardIds.Kazakus1,
	CardIds.KazakusGolemShaper,
	CardIds.KronxDragonhoof,
	CardIds.MurlocTastyfin,
	CardIds.Mankrik,
	CardIds.Peon1,
	CardIds.PrimordialProtector1,
	CardIds.Sandbinder,
	CardIds.SouthseaScoundrel,
	CardIds.Subject9,
	CardIds.TaelanFordringCore,
	CardIds.TentacledMenace,
	CardIds.TheCurator,
	CardIds.UtgardeGrapplesniper,
	CardIds.VenomousScorpid,
	CardIds.WitchwoodPiper,
	CardIds.WondrousWand,
	CardIds.Wrathion1,
];

export const getGalakrondCardFor = (className: string, invokeCount: number): string => {
	switch (className) {
		case 'priest':
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheUnspeakable_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheUnspeakable_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheUnspeakable;
		case 'rogue':
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheNightmare_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheNightmare_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheNightmare;
		case 'shaman':
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheTempest_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheTempest_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheTempest;
		case 'warlock':
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheWretched_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheWretched_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheWretched;
		case 'warrior':
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheUnbreakable_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheUnbreakable_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheUnbreakable;
	}
	return CardIds.GalakrondTheNightmare;
};

export const defaultStartingHp = (gameType: GameType, heroCardId: string): number => {
	if ([GameType.GT_BATTLEGROUNDS, GameType.GT_BATTLEGROUNDS_FRIENDLY].includes(gameType)) {
		switch (heroCardId) {
			case CardIds.PatchwerkBattlegrounds:
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
		case BoosterType.STORMWIND:
		case BoosterType.GOLDEN_STORMWIND:
			return 'stormwind';
		case BoosterType.STANDARD_HUNTER:
		case BoosterType.STANDARD_DRUID:
		case BoosterType.STANDARD_MAGE:
		case BoosterType.STANDARD_PALADIN:
		case BoosterType.STANDARD_WARRIOR:
		case BoosterType.STANDARD_PRIEST:
		case BoosterType.STANDARD_ROGUE:
		case BoosterType.STANDARD_SHAMAN:
		case BoosterType.STANDARD_WARLOCK:
		case BoosterType.STANDARD_DEMONHUNTER:
		case BoosterType.STANDARD_BUNDLE:
		case BoosterType.GOLDEN_STANDARD_BUNDLE:
		case BoosterType.MAMMOTH_BUNDLE:
		case BoosterType.YEAR_OF_DRAGON:
		case BoosterType.YEAR_OF_PHOENIX:
		case BoosterType.WILD_PACK:
		case BoosterType.SIGNUP_INCENTIVE:
		case BoosterType.FIRST_PURCHASE:
		default:
			// console.warn('unsupported booster type', boosterId);
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
		case 'wailing_caverns':
			return BoosterType.THE_BARRENS;
		case 'stormwind':
			return BoosterType.STORMWIND;
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
		case BoosterType.STORMWIND:
			return 'United in Stormwind';
		case BoosterType.GOLDEN_STORMWIND:
			return 'Golden United in Stormwind';
		case BoosterType.STANDARD_DEMONHUNTER:
			return 'Standard Demon Hunter';
		case BoosterType.STANDARD_DRUID:
			return 'Standard Druid';
		case BoosterType.STANDARD_HUNTER:
			return 'Standard Hunter';
		case BoosterType.STANDARD_MAGE:
			return 'Standard Mage';
		case BoosterType.STANDARD_PALADIN:
			return 'Standard Paladin';
		case BoosterType.STANDARD_PRIEST:
			return 'Standard Priest';
		case BoosterType.STANDARD_ROGUE:
			return 'Standard Rogue';
		case BoosterType.STANDARD_SHAMAN:
			return 'Standard Shaman';
		case BoosterType.STANDARD_WARLOCK:
			return 'Standard Warlock';
		case BoosterType.STANDARD_WARRIOR:
			return 'Standard Warrior';
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
		case BoosterType.STANDARD_BUNDLE:
			return 'Standard Pack';
		case BoosterType.GOLDEN_STANDARD_BUNDLE:
			return 'Golden Standard Pack';
		case BoosterType.WILD_PACK:
			return 'Wild Pack';
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
	CardIds.CounterspellLegacy,
	CardIds.CounterspellCore,
	CardIds.CounterspellVanilla,
	CardIds.OhMyYogg,
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

export const ladderRankToInt = (rank: string): number => {
	if (!rank?.length || !rank.includes('-')) {
		return null;
	}

	if (rank.includes('legend-')) {
		// So that top 1 is at the top
		return +rank.split('legend-')[1];
	}

	const [league, rankInLeague] = rank.split('-').map((info) => parseInt(info));
	return -(league - 5) * 10 + (10 - rankInLeague);
};

export const ladderIntRankToString = (rank: number, isLegend = false): string => {
	if (rank == null) {
		return null;
	}

	if (isLegend) {
		return `${rank}`;
	}

	const league = rankToLeague(rank);
	if (rank >= 50) {
		return 'Legend';
	}

	const rankInLeague = 10 - (rank % 10);
	return `${league} ${rankInLeague}`;
};

const rankToLeague = (rank: number): string => {
	if (rank < 10) {
		return 'Bronze';
	} else if (rank < 20) {
		return 'Silver';
	} else if (rank < 30) {
		return 'Gold';
	} else if (rank < 40) {
		return 'Platinum';
	} else if (rank < 50) {
		return 'Diamond';
	}
	return 'Legend';
};
