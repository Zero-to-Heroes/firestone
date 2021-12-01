import { allDuelsTreasureCardIds, CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';

const PASSIVES = [];

const SIGNATURE_TREASURES = [
	CardIds.BladeOfQuickeningTavernBrawlToken,
	CardIds.BindingChainsTavernBrawlToken,
	CardIds.GiftOfTheLegionTavernBrawl,
	CardIds.MoargOutcastTavernBrawlToken,
	CardIds.SummoningRitualTavernBrawlToken,
	CardIds.AwakenedAncientTavernBrawl,
	CardIds.HerdingHornTavernBrawlToken,
	CardIds.MarvelousMyceliumTavernBrawlToken,
	CardIds.MoonbeastTavernBrawlToken,
	CardIds.WardensInsightTavernBrawlToken,
	CardIds.ZukaraTheWildTavernBrawl,
	CardIds.BonecrusherTavernBrawlToken,
	CardIds.CarrotOnAStickTavernBrawl,
	CardIds.DeathstriderTavernBrawl,
	CardIds.SlatesSyringeTavernBrawl,
	CardIds.StalkingPrideTavernBrawlToken,
	CardIds.TraktamerAelessaTavernBrawl,
	CardIds.BritzBlazebucketTavernBrawl,
	CardIds.ElementalLearningTavernBrawl,
	CardIds.EmbercasterTavernBrawl,
	CardIds.InfiniteArcaneTavernBrawlToken,
	CardIds.WandOfDuelingTavernBrawlToken,
	CardIds.YoggTasticTastiesTavernBrawl,
	CardIds.DrocomurchanicasTavernBrawlToken,
	CardIds.FavoredRacerTavernBrawl,
	CardIds.HumbleBlessingsTavernBrawl,
	CardIds.MenAtArmsTavernBrawlToken,
	CardIds.RoyalGreatswordTavernBrawlToken,
	CardIds.SuLeadfootTavernBrawl,
	CardIds.DropletOfInsanityTavernBrawlToken,
	CardIds.FracturedSpiritsTavernBrawlToken,
	CardIds.HeraldOfTheScaledOnesTavernBrawl,
	CardIds.JorasThuldoomTavernBrawl,
	CardIds.ScionOfTheDeepTavernBrawlToken,
	CardIds.ShadowWordVoidTavernBrawl,
	CardIds.AceInTheHoleTavernBrawlToken,
	CardIds.AcquiredAlliesTavernBrawlToken,
	CardIds.DeadlyWeapons101TavernBrawlToken,
	CardIds.GreenTortollanShellTavernBrawl,
	CardIds.NerubianPeddlerTavernBrawlToken,
	CardIds.ChaosStormTavernBrawl,
	CardIds.FluctuatingTotemTavernBrawlToken,
	CardIds.InvokeTheVoidTavernBrawlToken,
	CardIds.PayloadTotemSpecialistTavernBrawl,
	CardIds.TempestsFuryTavernBrawlToken,
	CardIds.Demonology101TavernBrawlToken,
	CardIds.DemonizerTavernBrawlToken,
	CardIds.GiftOfTheOldGodsTavernBrawlToken,
	CardIds.ImpishAidTavernBrawl,
	CardIds.KillmoxTheBanishedOneTavernBrawlToken,
	CardIds.AutoArmamentsTavernBrawlToken,
	CardIds.BrewsterTheBrutalTavernBrawlToken,
	CardIds.CollectorsIreTavernBrawlToken,
	CardIds.ScrapmetalDemolitionistTavernBrawl,
	CardIds.SpikedArmsTavernBrawlToken,

	CardIds.ApocalypseTavernBrawlToken,
	CardIds.ClawsOfTerrorTavernBrawlToken,
	CardIds.FireStompTavernBrawlToken,
	CardIds.HornsOfFlameTavernBrawlToken,
	CardIds.SoulstoneTrapTavernBrawlToken,
	CardIds.Questionquestionquestion_BlackSoulstoneTavernBrawl,
];

export const isSignatureTreasure = (cardId: string, allCards: CardsFacadeService): boolean => {
	const card = allCards.getCard(cardId);
	return (
		SIGNATURE_TREASURES.includes(cardId as CardIds) ||
		(card && ['Minion', 'Spell'].includes(card.type) && card.id.startsWith('PVPDR_DMF_'))
	);
};

export const isPassive = (cardId: string, allCards: CardsFacadeService): boolean => {
	return PASSIVES.includes(cardId) || allCards.getCard(cardId)?.mechanics?.includes('DUNGEON_PASSIVE_BUFF');
};

// https://hearthstone.fandom.com/wiki/Duels#Current_season
export const duelsTreasureRank = (cardId: string): number => {
	if (!cardId) {
		return 0;
	}

	if (!allDuelsTreasureCardIds.includes(cardId as CardIds)) {
		console.error('Incorrect config for duels card IDs?', cardId);
	}
	switch (cardId) {
		// Passives
		case CardIds.AvengingArmamentsTavernBrawl:
		// case CardIds.AllTogetherNowTavernBrawl:
		case CardIds.BattleStanceTavernBrawl:
		case CardIds.BattleTotem2:
		// case CardIds.BookOfWonders:
		// case CardIds.Caltrops:
		// case CardIds.CannibalismTavernBrawl:
		case CardIds.BronzeSignetTavernBrawl:
		case CardIds.CloakOfEmeraldDreamsTavernBrawl:
		case CardIds.CorruptedFelstoneTavernBrawl:
		case CardIds.DisksOfLegend:
		case CardIds.DragonboneRitualTavernBrawl:
		case CardIds.EerieStoneTavernBrawl:
		case CardIds.ElixirOfVigor:
		case CardIds.EmeraldGogglesTavernBrawl:
		case CardIds.EnduranceTrainingTavernBrawl:
		case CardIds.ExpeditedBurialTavernBrawl:
		case CardIds.FlameWavesTavernBrawl:
		// case CardIds.FromTheSwampTavernBrawl:
		case CardIds.GlacialDownpourTavernBrawl:
		case CardIds.HagathasEmbrace:
		case CardIds.IdolsOfEluneTavernBrawl:
		case CardIds.ImpCredibleTrousersTavernBrawl:
		case CardIds.IronRootsTavernBrawl:
		case CardIds.KhadgarsScryingOrb:
		case CardIds.LegendaryLootTavernBrawl:
		case CardIds.MantleOfIgnitionTavernBrawl:
		case CardIds.MeekMasteryTavernBrawl:
		case CardIds.MummyMagic:
		case CardIds.OoopsAllSpellsTavernBrawl:
		case CardIds.OrbOfRevelationTavernBrawl:
		case CardIds.RallyTheTroopsTavernBrawl:
		case CardIds.RingOfBlackIceTavernBrawl:
		case CardIds.RunicHelmTavernBrawl:
		case CardIds.ScepterOfSummoning:
		case CardIds.SpecialDeliveryTavernBrawl:
		case CardIds.SpreadingSaplingsTavernBrawl:
		// case CardIds.StarvingTavernBrawl:
		case CardIds.TotemOfTheDead2:
		case CardIds.UnlockedPotential:
			return 2;

		// Passives Ultra Rare
		case CardIds.BandOfBeesTavernBrawl:
		case CardIds.CapturedFlag:
		case CardIds.DeathlyDeathTavernBrawl:
		case CardIds.DoubleTime:
		case CardIds.GreedyGainsTavernBrawl:
		case CardIds.ManastormTavernBrawl:
		case CardIds.OrbOfRevelationTavernBrawl:
		case CardIds.PartyReplacementTavernBrawl:
		case CardIds.RobeOfTheMagi:
		case CardIds.Stargazing:
			return 3;

		// Actives
		case CardIds.ArchmageStaffTavernBrawl:
		case CardIds.BookOfTheDeadTavernBrawl:
		case CardIds.GrimmerPatron:
		case CardIds.HyperblasterTavernBrawl:
		case CardIds.AncientReflectionsTavernBrawl:
		case CardIds.BagOfStuffingTavernBrawl:
		case CardIds.BladeOfTheBurningSun:
		case CardIds.GnomishArmyKnife:
		case CardIds.BananaSplitTavernBrawl:
		case CardIds.CanopicJarsTavernBrawl:
		case CardIds.PhaorisBlade:
		case CardIds.StaffOfScales:
		case CardIds.WandOfDisintegrationTavernBrawl:
		case CardIds.LocuuuustsTavernBrawl:
			return 2;

		// Actives Ultra Rare
		case CardIds.ChaosTheoryTavernBrawl:
		case CardIds.OverpoweredTavernBrawl:
		case CardIds.DreamgroveRing:
		case CardIds.EmbersOfRagnarosTavernBrawl:
		case CardIds.WaxRager:
		case CardIds.WishTavernBrawl:
			return 3;

		default:
			return 1;
	}
};

export const getDuelsHeroCardId = (playerClass: string): string => {
	switch (playerClass) {
		case 'demonhunter':
			return CardIds.StarStudentStelinaTavernBrawl;
		case 'druid':
			return CardIds.ForestWardenOmuTavernBrawl;
		case 'hunter':
			return CardIds.ProfessorSlateTavernBrawl;
		case 'mage':
			return CardIds.MozakiMasterDuelistTavernBrawl;
		case 'paladin':
			return CardIds.TuralyonTheTenuredTavernBrawl;
		case 'priest':
			return CardIds.MindrenderIlluciaTavernBrawl;
		case 'rogue':
			return CardIds.InfiltratorLilianTavernBrawl;
		case 'shaman':
			return CardIds.InstructorFireheartTavernBrawlToken;
		case 'warrior':
			return CardIds.RattlegoreTavernBrawl;
		case 'warlock':
			return CardIds.ArchwitchWillowTavernBrawl;
	}
};

export const getDuelsModeName = (mode: 'duels' | 'paid-duels'): string => {
	switch (mode) {
		case 'duels':
			return 'Casual';
		case 'paid-duels':
			return 'Heroic';
	}
};
