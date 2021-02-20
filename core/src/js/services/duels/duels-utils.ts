import { CardIds } from '@firestone-hs/reference-data';
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
