import { ReferenceCard, ScenarioId, TaskStatus, VillageVisitorType } from '@firestone-hs/reference-data';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BountyForMerc } from '../../components/mercenaries/desktop/mercenaries-personal-hero-stats.component';
import { Task } from '../../components/mercenaries/overlay/teams/mercenaries-team-root..component';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { MemoryVisitor } from '../../models/memory/memory-mercenaries-collection-info';
import {
	MercenariesHeroLevelFilterType,
	MercenariesModeFilterType,
	MercenariesPveDifficultyFilterType,
	MercenariesPvpMmrFilterType,
	MercenariesRoleFilterType,
	MercenariesStarterFilterType,
} from '../../models/mercenaries/mercenaries-filter-types';
import { CardsFacadeService } from '../cards-facade.service';
import {
	MercenariesComposition,
	MercenariesHeroStat,
	MercenariesReferenceData,
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
	return (
		(heroStats ?? [])
			// TODO: add proper support for time period, but I don't have enough data for now
			.filter((stat) => stat.date === 'last-patch')
			.filter((stat) =>
				modeFilter === 'pvp'
					? stat.mmrPercentile === mmrFilter
					: difficultyFilter === 'all' || stat.mmrPercentile === difficultyFilter,
			)
			.filter((stat) => (roleFilter === 'all' ? true : stat.heroRole === roleFilter))
			.filter((stat) => applyStarterFilter(stat, starterFilter))
			.filter((stat) => applyHeroLevelFilter(stat, 30))
			.filter((stat) => applySearchStringFilter(stat.heroCardId, searchString, allCards, referenceData))
	);
};

export const applySearchStringFilter = (
	heroCardId: string,
	searchString: string,
	allCards: CardsFacadeService,
	referenceData: MercenariesReferenceData,
): boolean => {
	if (!searchString?.length) {
		return true;
	}
	const referenceHero = referenceData.mercenaries.find(
		(merc) =>
			normalizeMercenariesCardId(allCards.getCardFromDbfId(merc.cardDbfId).id) ===
			normalizeMercenariesCardId(heroCardId),
	);
	const result =
		isValidMercSearchItem(allCards.getCardFromDbfId(referenceHero.cardDbfId), searchString) ||
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
	return stats.filter((stat) => stat.date === 'last-patch').filter((stat) => stat.mmrPercentile === mmrFilter);
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
	i18n: LocalizationFacadeService,
): readonly Task[] => {
	return (
		visitors
			// Just remove CLAIMED and INVALID
			.filter(
				(visitor) =>
					visitor.Status === TaskStatus.NEW ||
					visitor.Status === TaskStatus.ACTIVE ||
					visitor.Status === TaskStatus.COMPLETE,
			)
			.flatMap((visitor) => {
				const taskChains = referenceData.taskChains
					.filter((chain) => chain.mercenaryVisitorId === visitor.VisitorId)
					// So that we don't return events for which there is no visitor
					.filter((chain) => chain.tasks.some((t) => t.id === visitor.TaskId));
				// This is the case for tasks that are not linked to mercenaries, like Toki's daily bounties
				if (!taskChains?.length) {
					console.debug(
						'[tasks] no chain',
						visitor,
						referenceData.taskChains.find((chain) => chain.mercenaryVisitorId === visitor.VisitorId),
					);
					return null;
				}

				return taskChains.map((chain) => ({ chain: chain, visitor: visitor }));
			})
			.filter((info) => !!info)
			.map((info) => {
				const taskChain = info.chain;
				const visitor = info.visitor;

				const task = taskChain.tasks[visitor.TaskChainProgress];
				if (!task) {
					console.warn('empty task', visitor, taskChain);
					return null;
				}

				// 0 is not a valid id
				const mercIdForImage = task.mercenaryOverrideId || taskChain.mercenaryId;
				const refMerc = referenceData.mercenaries.find((merc) => merc.id === mercIdForImage);
				const mercenaryCard = allCards.getCardFromDbfId(refMerc.cardDbfId);
				const mercenaryCardId = mercenaryCard.id;
				const role = getHeroRole(mercenaryCard.mercenaryRole);
				const result = {
					...visitor, // For debugging purpose
					mercenaryCardId: mercenaryCardId,
					mercenaryRole: mercenaryCard.mercenaryRole,
					mercenaryName: mercenaryCard.name,
					title: task.title,
					header: isTaskChainStory(taskChain)
						? task.title
						: i18n.translateString('mercenaries.team-widget.task-title', {
								taskNumber: visitor.TaskChainProgress + 1,
								taskTitle: task.title,
						  }),
					description: task.description,
					progress: visitor.TaskProgress,
					quota: task.quota,
					progressPercentage: !!task.quota ? (100 * (visitor.TaskProgress ?? 0)) / task.quota : 0,
					taskChainProgress: visitor.TaskChainProgress,
					portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${mercenaryCardId}.jpg`,
					frameUrl: role
						? `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_${role}.png`
						: null,
					type: taskChain.taskChainType,
				} as Task;
				return result;
			})
			.filter((task) => !!task)
			.sort((a, b) => {
				if (a.mercenaryRole === 'TANK' && b.mercenaryRole !== 'TANK') {
					return -1;
				}
				if (a.mercenaryRole !== 'TANK' && b.mercenaryRole === 'TANK') {
					return 1;
				}
				if (a.mercenaryRole === 'FIGHTER' && b.mercenaryRole !== 'FIGHTER') {
					return -1;
				}
				if (a.mercenaryRole !== 'FIGHTER' && b.mercenaryRole === 'FIGHTER') {
					return 1;
				}
				if (a.mercenaryRole === 'CASTER' && b.mercenaryRole !== 'CASTER') {
					return -1;
				}
				if (a.mercenaryRole !== 'CASTER' && b.mercenaryRole === 'CASTER') {
					return 1;
				}
				return a.mercenaryName < b.mercenaryName ? -1 : 1;
			})
	);
};

const isTaskChainStory = (task: MercenariesReferenceData['taskChains'][0]): boolean => {
	return task.taskChainType === VillageVisitorType.SPECIAL && task.mercenaryVisitorId === 1938;
};

export const buildBounties = (
	refMerc: MercenariesReferenceData['mercenaries'][0],
	bountySets: MercenariesReferenceData['bountySets'],
): readonly BountyForMerc[] => {
	return bountySets
		.map((bountySet) =>
			bountySet.bounties
				.map((bounty) => {
					if (bounty.rewardMercenaryIds.includes(refMerc.id)) {
						return {
							bountySetName: bountySet.name,
							bountyName: bounty.name,
							sortOrder: bounty.sortOrder,
						};
					}
					return null;
				})
				.filter((info) => !!info),
		)
		.reduce((a, b) => [...a, ...b], []);
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
