import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';

const PASSIVES = [];

const SIGNATURE_TREASURES = [
	CardIds.NonCollectible.Demonhunter.GiftOfTheLegion,
	CardIds.NonCollectible.Demonhunter.MoargOutcast,
	CardIds.NonCollectible.Demonhunter.SummoningRitual2,
	CardIds.NonCollectible.Druid.HerdingHorn,
	CardIds.NonCollectible.Druid.Moonbeast,
	CardIds.NonCollectible.Druid.WardensInsight,
	CardIds.NonCollectible.Hunter.Bonecrusher,
	CardIds.NonCollectible.Hunter.SlatesSyringe,
	CardIds.NonCollectible.Hunter.StalkingPride,
	CardIds.NonCollectible.Mage.ElementalLearning,
	CardIds.NonCollectible.Mage.InfiniteArcane,
	CardIds.NonCollectible.Mage.WandOfDueling,
	CardIds.NonCollectible.Paladin.Drocomurchanicas,
	CardIds.NonCollectible.Paladin.MenAtArms,
	CardIds.NonCollectible.Paladin.RoyalGreatsword,
	CardIds.NonCollectible.Priest.DropletOfInsanity,
	CardIds.NonCollectible.Priest.FracturedSpirits,
	CardIds.NonCollectible.Priest.ScionOfTheDeep,
	CardIds.NonCollectible.Rogue.AcquiredAllies,
	CardIds.NonCollectible.Rogue.DeadlyWeapons101,
	CardIds.NonCollectible.Rogue.NerubianPeddler,
	CardIds.NonCollectible.Shaman.FluctuatingTotem,
	CardIds.NonCollectible.Shaman.InvokeTheVoid,
	CardIds.NonCollectible.Shaman.TempestsFury,
	CardIds.NonCollectible.Warlock.GiftOfTheOldGods,
	CardIds.NonCollectible.Warlock.ImpishAid,
	CardIds.NonCollectible.Warlock.KillmoxTheBanishedOne,
	CardIds.NonCollectible.Warrior.AutoArmaments,
	CardIds.NonCollectible.Warrior.BrewsterTheBrutal,
	CardIds.NonCollectible.Warrior.CollectorsIre,
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
