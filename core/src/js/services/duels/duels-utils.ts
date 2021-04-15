import { allDuelsTreasureCardIds, CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';

const PASSIVES = [];

const SIGNATURE_TREASURES = [
	CardIds.NonCollectible.Demonhunter.BladeOfQuickening,
	CardIds.NonCollectible.Demonhunter.BindingChains1,
	CardIds.NonCollectible.Demonhunter.GiftOfTheLegion,
	CardIds.NonCollectible.Demonhunter.MoargOutcast,
	CardIds.NonCollectible.Demonhunter.SummoningRitual2,
	CardIds.NonCollectible.Druid.AwakenedAncient,
	CardIds.NonCollectible.Druid.HerdingHorn,
	CardIds.NonCollectible.Druid.MarvelousMycelium,
	CardIds.NonCollectible.Druid.Moonbeast,
	CardIds.NonCollectible.Druid.WardensInsight,
	CardIds.NonCollectible.Druid.ZukaraTheWild,
	CardIds.NonCollectible.Hunter.Bonecrusher,
	CardIds.NonCollectible.Hunter.CarrotOnAStick,
	CardIds.NonCollectible.Hunter.Deathstrider,
	CardIds.NonCollectible.Hunter.SlatesSyringe,
	CardIds.NonCollectible.Hunter.StalkingPride,
	CardIds.NonCollectible.Hunter.TraktamerAelessa,
	CardIds.NonCollectible.Mage.BritzBlazebucket,
	CardIds.NonCollectible.Mage.ElementalLearning,
	CardIds.NonCollectible.Mage.Embercaster,
	CardIds.NonCollectible.Mage.InfiniteArcane,
	CardIds.NonCollectible.Mage.WandOfDueling,
	CardIds.NonCollectible.Mage.YoggTasticTasties,
	CardIds.NonCollectible.Paladin.Drocomurchanicas,
	CardIds.NonCollectible.Paladin.FavoredRacer,
	CardIds.NonCollectible.Paladin.HumbleBlessings,
	CardIds.NonCollectible.Paladin.MenAtArms,
	CardIds.NonCollectible.Paladin.RoyalGreatsword,
	CardIds.NonCollectible.Paladin.SuLeadfoot,
	CardIds.NonCollectible.Priest.DropletOfInsanity,
	CardIds.NonCollectible.Priest.FracturedSpirits,
	CardIds.NonCollectible.Priest.HeraldOfTheScaledOnes,
	CardIds.NonCollectible.Priest.JorasThuldoom,
	CardIds.NonCollectible.Priest.ScionOfTheDeep,
	CardIds.NonCollectible.Priest.ShadowWordVoid,
	CardIds.NonCollectible.Rogue.AceInTheHole,
	CardIds.NonCollectible.Rogue.AcquiredAllies,
	CardIds.NonCollectible.Rogue.DeadlyWeapons101,
	CardIds.NonCollectible.Rogue.GreenTortollanShell,
	CardIds.NonCollectible.Rogue.NerubianPeddler,
	CardIds.NonCollectible.Shaman.ChaosStorm1,
	CardIds.NonCollectible.Shaman.FluctuatingTotem,
	CardIds.NonCollectible.Shaman.InvokeTheVoid,
	CardIds.NonCollectible.Shaman.PayloadTotemSpecialist,
	CardIds.NonCollectible.Shaman.TempestsFury,
	CardIds.NonCollectible.Warlock.Demonology101,
	CardIds.NonCollectible.Warlock.Demonizer,
	CardIds.NonCollectible.Warlock.GiftOfTheOldGods,
	CardIds.NonCollectible.Warlock.ImpishAid,
	CardIds.NonCollectible.Warlock.KillmoxTheBanishedOne,
	CardIds.NonCollectible.Warrior.AutoArmaments,
	CardIds.NonCollectible.Warrior.BrewsterTheBrutal,
	CardIds.NonCollectible.Warrior.CollectorsIre,
	CardIds.NonCollectible.Warrior.ScrapmetalDemolitionist,
	CardIds.NonCollectible.Warrior.SpikedArms,
];

export const isSignatureTreasure = (cardId: string, allCards: AllCardsService): boolean => {
	const card = allCards.getCard(cardId);
	return (
		SIGNATURE_TREASURES.includes(cardId) ||
		(card && ['Minion', 'Spell'].includes(card.type) && card.id.startsWith('PVPDR_DMF_'))
	);
};

export const isPassive = (cardId: string, allCards: AllCardsService): boolean => {
	return PASSIVES.includes(cardId) || allCards.getCard(cardId)?.mechanics?.includes('DUNGEON_PASSIVE_BUFF');
};

// https://hearthstone.fandom.com/wiki/Duels#Current_season
export const duelsTreasureRank = (cardId: string): number => {
	if (!cardId) {
		return 0;
	}

	if (!allDuelsTreasureCardIds.includes(cardId)) {
		console.error('Incorrect config for duels card IDs?', cardId);
	}
	switch (cardId) {
		// Passives
		case CardIds.NonCollectible.Neutral.AvengingArmaments2:
		case CardIds.NonCollectible.Neutral.BattleTotem1:
		case CardIds.NonCollectible.Neutral.BookOfWonders:
		case CardIds.NonCollectible.Neutral.Caltrops:
		case CardIds.NonCollectible.Neutral.CorruptedFelstone:
		case CardIds.NonCollectible.Neutral.DisksOfLegend:
		case CardIds.NonCollectible.Neutral.DoubleTime:
		case CardIds.NonCollectible.Neutral.DragonboneRitualTavernBrawl2:
		case CardIds.NonCollectible.Neutral.EerieStone:
		case CardIds.NonCollectible.Neutral.EmeraldGogglesTavernBrawl2:
		case CardIds.NonCollectible.Neutral.EnduranceTraining:
		case CardIds.NonCollectible.Neutral.FlameWaves:
		case CardIds.NonCollectible.Neutral.FromTheSwampTavernBrawl2:
		case CardIds.NonCollectible.Neutral.HagathasEmbrace:
		case CardIds.NonCollectible.Neutral.KhadgarsScryingOrb:
		case CardIds.NonCollectible.Neutral.MummyMagic:
		case CardIds.NonCollectible.Neutral.OrbOfRevelation2:
		case CardIds.NonCollectible.Neutral.RallyTheTroops2:
		case CardIds.NonCollectible.Neutral.ScepterOfSummoning:
		case CardIds.NonCollectible.Neutral.SpecialDelivery:
		case CardIds.NonCollectible.Neutral.SpreadingSaplings:
		case CardIds.NonCollectible.Neutral.StarvingTavernBrawl2:
		case CardIds.NonCollectible.Neutral.TotemOfTheDead1:
			return 2;
		// Passives Ultra Rare
		case CardIds.NonCollectible.Neutral.BandOfBees:
		case CardIds.NonCollectible.Neutral.CapturedFlag:
		case CardIds.NonCollectible.Neutral.ElixirOfVigor:
		case CardIds.NonCollectible.Neutral.ManastormTavernBrawl1:
		case CardIds.NonCollectible.Neutral.RobeOfTheMagi:
		case CardIds.NonCollectible.Neutral.Stargazing:
			return 3;
		// Actives
		case CardIds.NonCollectible.Neutral.ArchmageStaffTavernBrawl:
		case CardIds.NonCollectible.Neutral.BookOfTheDeadTavernBrawl:
		case CardIds.NonCollectible.Neutral.GrimmerPatron:
		case CardIds.NonCollectible.Neutral.HyperblasterTavernBrawl:
		case CardIds.NonCollectible.Neutral.AncientReflectionsTavernBrawl:
		case CardIds.NonCollectible.Neutral.BagOfStuffingTavernBrawl:
		case CardIds.NonCollectible.Neutral.BladeOfTheBurningSun:
		case CardIds.NonCollectible.Neutral.GnomishArmyKnife:
		case CardIds.NonCollectible.Neutral.BananaSplitTavernBrawl:
		case CardIds.NonCollectible.Neutral.CanopicJarsTavernBrawl2:
		case CardIds.NonCollectible.Neutral.PhaorisBladeTavernBrawl:
		case CardIds.NonCollectible.Neutral.StaffOfScales:
		case CardIds.NonCollectible.Neutral.WandOfDisintegrationTavernBrawl:
		case CardIds.NonCollectible.Neutral.LocuuuustsTavernBrawl2:
			return 2;
		// Actives Ultra Rare
		case CardIds.NonCollectible.Neutral.ChaosTheoryTavernBrawl:
		case CardIds.NonCollectible.Neutral.OverpoweredTavernBrawl2:
		case CardIds.NonCollectible.Neutral.DreamgroveRing:
		case CardIds.NonCollectible.Neutral.EmbersOfRagnarosTavernBrawl:
		case CardIds.NonCollectible.Neutral.WaxRager:
		case CardIds.NonCollectible.Neutral.WishTavernBrawl:
			return 3;
		default:
			return 1;
	}
};

export const getDuelsHeroCardId = (playerClass: string): string => {
	switch (playerClass) {
		case 'demonhunter':
			return CardIds.NonCollectible.Demonhunter.StarStudentStelina;
		case 'druid':
			return CardIds.NonCollectible.Druid.ForestWardenOmu;
		case 'hunter':
			return CardIds.NonCollectible.Hunter.ProfessorSlate;
		case 'mage':
			return CardIds.NonCollectible.Mage.MozakiMasterDuelist;
		case 'paladin':
			return CardIds.NonCollectible.Paladin.TuralyonTheTenured;
		case 'priest':
			return CardIds.NonCollectible.Priest.MindrenderIllucia;
		case 'rogue':
			return CardIds.NonCollectible.Rogue.InfiltratorLilian;
		case 'shaman':
			return CardIds.NonCollectible.Shaman.InstructorFireheart;
		case 'warrior':
			return CardIds.NonCollectible.Warrior.Rattlegore;
		case 'warlock':
			return CardIds.NonCollectible.Warlock.ArchwitchWillow;
	}
};
