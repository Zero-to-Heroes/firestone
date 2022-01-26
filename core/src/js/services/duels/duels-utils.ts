import {
	allDuelsTreasureCardIds,
	CardIds,
	duelsActivePool2,
	duelsActivePool2UltraRare,
	duelsPassivePool2,
	duelsPassivePool2UltraRare,
} from '@firestone-hs/reference-data';
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

	CardIds.ValorousDisplayTavernBrawlToken,
	CardIds.ElementalChaosTavernBrawlToken,
	CardIds.PactOfTheLichTavernBrawlToken,
	CardIds.MagisterUnchainedTavernBrawlToken,
	CardIds.GiftOfTheHeartTavernBrawlToken,
	CardIds.ForTheHordeTavernBrawlToken,
	CardIds.ForgeInLightTavernBrawlToken,
	CardIds.SpymastersGambitTavernBrawlToken,
	CardIds.StalkersSuppliesTavernBrawlToken,
	CardIds.RendingAmbushTavernBrawlToken,
	CardIds.DevoutBlessingsTavernBrawlToken,
	CardIds.ForTheAllianceTavernBrawlToken,
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
	if (duelsPassivePool2.includes(cardId as CardIds) || duelsActivePool2.includes(cardId as CardIds)) {
		return 2;
	} else if (
		duelsPassivePool2UltraRare.includes(cardId as CardIds) ||
		duelsActivePool2UltraRare.includes(cardId as CardIds)
	) {
		return 3;
	}
	return 1;
};

// TODO: probably change this method to use the hero instead of the class
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
