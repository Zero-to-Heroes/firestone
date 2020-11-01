import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';

const PASSIVES = [];

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
