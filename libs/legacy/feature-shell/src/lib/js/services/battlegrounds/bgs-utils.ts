import { ReferenceCard } from '@firestone-hs/reference-data';
import { getAchievementSectionIdFromHeroCardId } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { VisualAchievement } from '../../models/visual-achievement';

export const getAchievementsForHero = (
	heroCardId: string,
	heroAchievements: readonly VisualAchievement[],
	allCards: CardsFacadeService,
): readonly VisualAchievement[] => {
	const dbHero = allCards.getCard(heroCardId);
	const heroName = formatHeroNameForAchievements(dbHero);
	const sectionId = getAchievementSectionIdFromHeroCardId(heroCardId);
	if (!!sectionId) {
		return (heroAchievements ?? []).filter((ach) => ach.hsSectionId === sectionId);
	}

	if (!heroName) {
		return [];
	}
	// Doesn't work with localized data, but we should never be in that situation
	console.warn('missing section id for', heroCardId, heroName);
	const searchName = `as ${heroName}`;
	const result = (heroAchievements ?? []).filter((ach) => ach.text.replace(/,/g, '').includes(searchName));
	if (!result?.length) {
		console.warn('Could not load achievements for hero', heroCardId, searchName, heroAchievements);
	}
	return result;
};

// Because inconsistencies
const formatHeroNameForAchievements = (hero: ReferenceCard): string => {
	switch (hero?.id) {
		// case CardIds.MaievShadowsongBattlegrounds:
		// 	return 'Maiev';
		// case CardIds.KingMuklaBattlegrounds:
		// 	return 'Mukla';
		// case CardIds.DinotamerBrannBattlegrounds:
		// 	return 'Brann';
		// case CardIds.ArannaStarseekerBattlegrounds:
		// 	return 'Aranna';
		// case CardIds.RagnarosTheFirelordBattlegrounds_TB_BaconShop_HERO_11:
		// 	return 'Ragnaros';
		// case CardIds.AFKayBattlegrounds:
		// 	return 'A.F.Kay'; // No whitespace
		default:
			return hero?.name?.replace(/,/g, '');
	}
};
