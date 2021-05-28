import { allDuelsTreasureCardIds, CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';

const PASSIVES = [];

const SIGNATURE_TREASURES = [
	CardIds.NonCollectible.Demonhunter.BladeOfQuickeningTavernBrawlToken,
	CardIds.NonCollectible.Demonhunter.BindingChainsTavernBrawlToken,
	CardIds.NonCollectible.Demonhunter.GiftOfTheLegionTavernBrawl,
	CardIds.NonCollectible.Demonhunter.MoargOutcastTavernBrawlToken,
	CardIds.NonCollectible.Demonhunter.SummoningRitualTavernBrawlToken,
	CardIds.NonCollectible.Druid.AwakenedAncientTavernBrawl,
	CardIds.NonCollectible.Druid.HerdingHornTavernBrawlToken,
	CardIds.NonCollectible.Druid.MarvelousMyceliumTavernBrawlToken,
	CardIds.NonCollectible.Druid.MoonbeastTavernBrawlToken,
	CardIds.NonCollectible.Druid.WardensInsightTavernBrawlToken,
	CardIds.NonCollectible.Druid.ZukaraTheWildTavernBrawl,
	CardIds.NonCollectible.Hunter.BonecrusherTavernBrawlToken,
	CardIds.NonCollectible.Hunter.CarrotOnAStickTavernBrawl,
	CardIds.NonCollectible.Hunter.DeathstriderTavernBrawl,
	CardIds.NonCollectible.Hunter.SlatesSyringeTavernBrawl,
	CardIds.NonCollectible.Hunter.StalkingPrideTavernBrawlToken,
	CardIds.NonCollectible.Hunter.TraktamerAelessaTavernBrawl,
	CardIds.NonCollectible.Mage.BritzBlazebucketTavernBrawl,
	CardIds.NonCollectible.Mage.ElementalLearningTavernBrawl,
	CardIds.NonCollectible.Mage.EmbercasterTavernBrawl,
	CardIds.NonCollectible.Mage.InfiniteArcaneTavernBrawlToken,
	CardIds.NonCollectible.Mage.WandOfDuelingTavernBrawlToken,
	CardIds.NonCollectible.Mage.YoggTasticTastiesTavernBrawl,
	CardIds.NonCollectible.Paladin.DrocomurchanicasTavernBrawlToken,
	CardIds.NonCollectible.Paladin.FavoredRacerTavernBrawl,
	CardIds.NonCollectible.Paladin.HumbleBlessingsTavernBrawl,
	CardIds.NonCollectible.Paladin.MenAtArmsTavernBrawlToken,
	CardIds.NonCollectible.Paladin.RoyalGreatswordTavernBrawlToken,
	CardIds.NonCollectible.Paladin.SuLeadfootTavernBrawl,
	CardIds.NonCollectible.Priest.DropletOfInsanityTavernBrawlToken,
	CardIds.NonCollectible.Priest.FracturedSpiritsTavernBrawlToken,
	CardIds.NonCollectible.Priest.HeraldOfTheScaledOnesTavernBrawl,
	CardIds.NonCollectible.Priest.JorasThuldoomTavernBrawl,
	CardIds.NonCollectible.Priest.ScionOfTheDeepTavernBrawlToken,
	CardIds.NonCollectible.Priest.ShadowWordVoidTavernBrawl,
	CardIds.NonCollectible.Rogue.AceInTheHoleTavernBrawlToken,
	CardIds.NonCollectible.Rogue.AcquiredAlliesTavernBrawlToken,
	CardIds.NonCollectible.Rogue.DeadlyWeapons101TavernBrawlToken,
	CardIds.NonCollectible.Rogue.GreenTortollanShellTavernBrawl,
	CardIds.NonCollectible.Rogue.NerubianPeddlerTavernBrawlToken,
	CardIds.NonCollectible.Shaman.ChaosStormTavernBrawl,
	CardIds.NonCollectible.Shaman.FluctuatingTotemTavernBrawlToken,
	CardIds.NonCollectible.Shaman.InvokeTheVoidTavernBrawlToken,
	CardIds.NonCollectible.Shaman.PayloadTotemSpecialistTavernBrawl,
	CardIds.NonCollectible.Shaman.TempestsFuryTavernBrawlToken,
	CardIds.NonCollectible.Warlock.Demonology101TavernBrawlToken,
	CardIds.NonCollectible.Warlock.DemonizerTavernBrawlToken,
	CardIds.NonCollectible.Warlock.GiftOfTheOldGodsTavernBrawlToken,
	CardIds.NonCollectible.Warlock.ImpishAidTavernBrawl,
	CardIds.NonCollectible.Warlock.KillmoxTheBanishedOneTavernBrawlToken,
	CardIds.NonCollectible.Warrior.AutoArmamentsTavernBrawlToken,
	CardIds.NonCollectible.Warrior.BrewsterTheBrutalTavernBrawlToken,
	CardIds.NonCollectible.Warrior.CollectorsIreTavernBrawlToken,
	CardIds.NonCollectible.Warrior.ScrapmetalDemolitionistTavernBrawl,
	CardIds.NonCollectible.Warrior.SpikedArmsTavernBrawlToken,
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
		case CardIds.NonCollectible.Neutral.AvengingArmamentsTavernBrawl:
		case CardIds.NonCollectible.Neutral.BattleTotem1:
		case CardIds.NonCollectible.Neutral.BookOfWonders:
		case CardIds.NonCollectible.Neutral.Caltrops:
		case CardIds.NonCollectible.Neutral.CorruptedFelstoneTavernBrawl:
		case CardIds.NonCollectible.Neutral.DisksOfLegend:
		case CardIds.NonCollectible.Neutral.DoubleTime:
		case CardIds.NonCollectible.Neutral.DragonboneRitualTavernBrawl:
		case CardIds.NonCollectible.Neutral.EerieStoneTavernBrawl:
		case CardIds.NonCollectible.Neutral.EmeraldGogglesTavernBrawl:
		case CardIds.NonCollectible.Neutral.EnduranceTrainingTavernBrawl:
		case CardIds.NonCollectible.Neutral.FlameWavesTavernBrawl:
		case CardIds.NonCollectible.Neutral.FromTheSwampTavernBrawl:
		case CardIds.NonCollectible.Neutral.HagathasEmbrace:
		case CardIds.NonCollectible.Neutral.KhadgarsScryingOrb:
		case CardIds.NonCollectible.Neutral.MummyMagic:
		case CardIds.NonCollectible.Neutral.OrbOfRevelationTavernBrawl:
		case CardIds.NonCollectible.Neutral.RallyTheTroopsTavernBrawl:
		case CardIds.NonCollectible.Neutral.ScepterOfSummoning:
		case CardIds.NonCollectible.Neutral.SpecialDeliveryTavernBrawl:
		case CardIds.NonCollectible.Neutral.SpreadingSaplingsTavernBrawl:
		case CardIds.NonCollectible.Neutral.StarvingTavernBrawl:
		case CardIds.NonCollectible.Neutral.TotemOfTheDead1:
		case CardIds.NonCollectible.Neutral.UnlockedPotential:
			return 2;
		// Passives Ultra Rare
		case CardIds.NonCollectible.Neutral.BandOfBees:
		case CardIds.NonCollectible.Neutral.CapturedFlag:
		case CardIds.NonCollectible.Neutral.ElixirOfVigor:
		case CardIds.NonCollectible.Neutral.ManastormTavernBrawl:
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
		case CardIds.NonCollectible.Neutral.CanopicJarsTavernBrawl:
		case CardIds.NonCollectible.Neutral.PhaorisBlade:
		case CardIds.NonCollectible.Neutral.StaffOfScales:
		case CardIds.NonCollectible.Neutral.WandOfDisintegrationTavernBrawl:
		case CardIds.NonCollectible.Neutral.LocuuuustsTavernBrawl:
			return 2;
		// Actives Ultra Rare
		case CardIds.NonCollectible.Neutral.ChaosTheoryTavernBrawl:
		case CardIds.NonCollectible.Neutral.OverpoweredTavernBrawl:
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
			return CardIds.NonCollectible.Demonhunter.StarStudentStelinaTavernBrawl;
		case 'druid':
			return CardIds.NonCollectible.Druid.ForestWardenOmuTavernBrawl;
		case 'hunter':
			return CardIds.NonCollectible.Hunter.ProfessorSlateTavernBrawl;
		case 'mage':
			return CardIds.NonCollectible.Mage.MozakiMasterDuelistTavernBrawl;
		case 'paladin':
			return CardIds.NonCollectible.Paladin.TuralyonTheTenuredTavernBrawl;
		case 'priest':
			return CardIds.NonCollectible.Priest.MindrenderIlluciaTavernBrawl;
		case 'rogue':
			return CardIds.NonCollectible.Rogue.InfiltratorLilianTavernBrawl;
		case 'shaman':
			return CardIds.NonCollectible.Shaman.InstructorFireheartTavernBrawlToken;
		case 'warrior':
			return CardIds.NonCollectible.Warrior.RattlegoreTavernBrawl;
		case 'warlock':
			return CardIds.NonCollectible.Warlock.ArchwitchWillowTavernBrawl;
	}
};
