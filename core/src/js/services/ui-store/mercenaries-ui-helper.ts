import { ReferenceCard, ScenarioId, TaskStatus } from '@firestone-hs/reference-data';
import { Task } from '../../components/mercenaries/overlay/teams/mercenaries-team-root..component';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { MemoryVisitor } from '../../models/memory/memory-mercenaries-collection-info';
import { MercenariesHeroLevelFilterType } from '../../models/mercenaries/mercenaries-hero-level-filter.type';
import { MercenariesModeFilterType } from '../../models/mercenaries/mercenaries-mode-filter.type';
import { MercenariesPveDifficultyFilterType } from '../../models/mercenaries/mercenaries-pve-difficulty-filter.type';
import { MercenariesPvpMmrFilterType } from '../../models/mercenaries/mercenaries-pvp-mmr-filter.type';
import { MercenariesRoleFilterType } from '../../models/mercenaries/mercenaries-role-filter.type';
import { MercenariesStarterFilterType } from '../../models/mercenaries/mercenaries-starter-filter.type';
import { CardsFacadeService } from '../cards-facade.service';
import {
	MercenariesComposition,
	MercenariesHeroStat,
	MercenariesReferenceData
} from '../mercenaries/mercenaries-state-builder.service';
import { getHeroRole, isMercenariesPvE, normalizeMercenariesCardId } from '../mercenaries/mercenaries-utils';

export const filterMercenariesHeroStats = (
	heroStats: readonly MercenariesHeroStat[],
	modeFilter: MercenariesModeFilterType,
	roleFilter: MercenariesRoleFilterType,
	difficultyFilter: MercenariesPveDifficultyFilterType,
	mmrFilter: MercenariesPvpMmrFilterType,
	starterFilter: MercenariesStarterFilterType,
	heroLevelFilter: MercenariesHeroLevelFilterType,
	allCards: CardsFacadeService,
	referenceData: MercenariesReferenceData,
	searchString: string = null,
): readonly MercenariesHeroStat[] => {
	return (heroStats ?? [])
		.filter((stat) => stat.date === 'past-seven')
		.filter((stat) =>
			modeFilter === 'pvp'
				? stat.mmrPercentile === mmrFilter
				: difficultyFilter === 'all' || stat.mmrPercentile === difficultyFilter,
		)
		.filter((stat) => (roleFilter === 'all' ? true : stat.heroRole === roleFilter))
		.filter((stat) => applyStarterFilter(stat, starterFilter))
		.filter((stat) => applyHeroLevelFilter(stat, 30))
		.filter((stat) => applySearchStringFilter(stat.heroCardId, searchString, allCards, referenceData));
};

export const applySearchStringFilter = (
	heroCardId: string,
	searchString: string,
	allCards: CardsFacadeService,
	referenceData: MercenariesReferenceData,
): boolean => {
	const referenceHero = referenceData.mercenaries.find(
		(merc) =>
			normalizeMercenariesCardId(allCards.getCardFromDbfId(merc.cardDbfId).id) ===
			normalizeMercenariesCardId(heroCardId),
	);
	// console.debug('referenceHero', referenceHero, heroCardId, referenceData);
	const result =
		isValidMercSearchItem(allCards.getCardFromDbfId(referenceHero.id), searchString) ||
		referenceHero.abilities.some((ability) =>
			isValidMercSearchItem(allCards.getCardFromDbfId(ability.cardDbfId), searchString),
		) ||
		referenceHero.equipments.some((equipment) =>
			isValidMercSearchItem(allCards.getCardFromDbfId(equipment.cardDbfId), searchString),
		);
	return result;
};

export const isValidMercSearchItem = (card: ReferenceCard, searchString: string): boolean => {
	if (!searchString?.length) {
		return true;
	}

	const lowSearchString = searchString.toLowerCase().trim();
	if (card.name && card.name.toLowerCase().includes(lowSearchString)) {
		return true;
	}
	if (card.text && card.text.toLowerCase().includes(lowSearchString)) {
		return true;
	}
	if (card.race && card.race.toLowerCase().includes(lowSearchString)) {
		return true;
	}
	if (card.spellSchool && card.spellSchool.toLowerCase().includes(lowSearchString)) {
		return true;
	}
	if (!!card.mechanics?.length && card.mechanics.some((tag) => tag.toLowerCase().includes(lowSearchString))) {
		return true;
	}
	if (
		!!card.referencedTags?.length &&
		card.referencedTags.some((tag) => tag.toLowerCase().includes(lowSearchString))
	) {
		return true;
	}

	return false;
};

export const filterMercenariesCompositions = (
	stats: readonly MercenariesComposition[],
	// modeFilter: MercenariesModeFilterType,
	// difficultyFilter: MercenariesPveDifficultyFilterType,
	mmrFilter: MercenariesPvpMmrFilterType,
): readonly MercenariesComposition[] => {
	return stats.filter((stat) => stat.date === 'past-seven').filter((stat) => stat.mmrPercentile === mmrFilter);
};

export const filterMercenariesRuns = (
	games: readonly GameStat[],
	modeFilter: MercenariesModeFilterType,
	roleFilter: MercenariesRoleFilterType,
	difficultyFilter: MercenariesPveDifficultyFilterType,
	mmrFilter: MercenariesPvpMmrFilterType,
	starterFilter: MercenariesStarterFilterType,
	heroLevelFilter: MercenariesHeroLevelFilterType,
): readonly GameStat[] => {
	return games.filter((stat) =>
		modeFilter === 'pve' ? isMercenariesPvE(stat.gameMode) : stat.scenarioId === ScenarioId.LETTUCE_PVP,
	);
};

export const buildMercenariesTasksList = (
	referenceData: MercenariesReferenceData,
	visitors: readonly MemoryVisitor[],
	allCards: CardsFacadeService,
): readonly Task[] => {
	return visitors
		.filter((visitor) => visitor.Status == TaskStatus.NEW || visitor.Status === TaskStatus.ACTIVE)
		.map((visitor) => {
			const taskChain = referenceData.taskChains.find((chain) => chain.mercenaryVisitorId === visitor.VisitorId);
			// This is the case for tasks that are not linked to mercenaries, like Toki's daily bounties
			if (!taskChain) {
				return null;
			}

			const task = [...taskChain.tasks].sort((a, b) => a.id - b.id)[visitor.TaskChainProgress];
			if (!task) {
				console.warn('empty task', visitor, taskChain);
				return null;
			}

			const refMerc = referenceData.mercenaries.find((merc) => merc.id === taskChain.mercenaryId);
			const mercenaryCard = allCards.getCardFromDbfId(refMerc.cardDbfId);
			const mercenaryCardId = mercenaryCard.id;
			const result = {
				...visitor, // For debugging purpose
				mercenaryCardId: mercenaryCardId,
				title: task.title,
				description: task.description,
				progress: visitor.TaskProgress,
				taskChainProgress: visitor.TaskChainProgress,
				portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${mercenaryCardId}.jpg`,
				frameUrl: `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_${getHeroRole(
					mercenaryCard.mercenaryRole,
				)}.png?v=5`,
			} as Task;
			return result;
		})
		.filter((task) => !!task);
};

const applyStarterFilter = (stat: MercenariesHeroStat, starterFilter: MercenariesStarterFilterType): boolean => {
	switch (starterFilter) {
		case 'all':
			return true;
		case 'starter':
			return stat.starter;
		case 'bench':
			return !stat.starter;
	}
};

const applyHeroLevelFilter = (stat: MercenariesHeroStat, heroLevelFilter: MercenariesHeroLevelFilterType): boolean => {
	switch (heroLevelFilter) {
		case 0:
			return true;
		case 1:
			return stat.heroLevel >= 1 && stat.heroLevel < 5;
		case 5:
			return stat.heroLevel >= 5 && stat.heroLevel < 15;
		case 15:
			return stat.heroLevel >= 15 && stat.heroLevel < 30;
		case 30:
			return stat.heroLevel === 30;
	}
};
