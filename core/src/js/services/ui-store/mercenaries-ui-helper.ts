import { ReferenceCard, TaskStatus, VillageVisitorType } from '@firestone-hs/reference-data';
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
import {
	getHeroRole,
	getShortMercHeroName,
	isMercenariesPvE,
	isMercenariesPvP,
	normalizeMercenariesCardId,
} from '../mercenaries/mercenaries-utils';

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
		modeFilter === 'pve' ? isMercenariesPvE(stat.gameMode) : isMercenariesPvP(stat.gameMode),
	);
};

export const buildMercenariesTasksList = (
	referenceData: MercenariesReferenceData,
	visitors: readonly MemoryVisitor[],
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
	restrictToMercsIds: readonly number[] = [],
): readonly Task[] => {
	const potentialVisitors = visitors
		// Just remove CLAIMED and INVALID
		.filter(
			(visitor) =>
				visitor.Status === TaskStatus.NEW ||
				visitor.Status === TaskStatus.ACTIVE ||
				visitor.Status === TaskStatus.COMPLETE,
		);
	// No use showing a big list of 20+ tasks in that widget, so if there are too many
	// ongoing tasks, we will only show the "special" ones
	const shouldUseMercsRestrition = !!restrictToMercsIds?.length || potentialVisitors.length > 6;
	// console.debug('potentialVisitors', potentialVisitors, shouldUseMercsRestrition);
	return potentialVisitors
		.flatMap((visitor) => {
			const taskChains = referenceData.taskChains
				.filter((chain) => chain.mercenaryVisitorId === visitor.VisitorId)
				// So that we don't return events for which there is no visitor
				.filter((chain) => chain.tasks.some((t) => t.id === visitor.TaskId));

			return !!taskChains?.length
				? taskChains.map((chain) => ({ chain: chain, visitor: visitor }))
				: { chain: null, visitor: visitor };
		})
		.map((info) => {
			const taskChain: MercenariesReferenceData['taskChains'][0] = info.chain;
			const visitor = info.visitor;

			// Procedural tasks don't belong to a task chain
			const task = !!taskChain
				? taskChain.tasks[visitor.TaskChainProgress]
				: referenceData.repeatableTasks.find((t) => t.id === visitor.TaskId);
			if (!task) {
				console.warn('empty task', visitor, taskChain);
				return null;
			}

			// 0 is not a valid id
			const mercIdForImage = task.mercenaryOverrideId || taskChain?.mercenaryId || visitor.ProceduralMercenaryId;
			const refMerc = referenceData.mercenaries.find((merc) => merc.id === mercIdForImage);
			const isProceduralTask = !!visitor.ProceduralMercenaryId || visitor.ProceduralBountyId;
			if (!refMerc) {
				console.warn(
					'missing ref merc',
					refMerc,
					mercIdForImage,
					task.mercenaryOverrideId,
					taskChain?.mercenaryId,
					visitor?.ProceduralMercenaryId,
					taskChain,
					visitor,
					referenceData?.mercenaries?.length,
				);
				// I've seen this for the Toki repeatable task (task id 28017)
				return null;
			}
			// Always keep the special tasks
			if (
				shouldUseMercsRestrition &&
				taskChain?.taskChainType === VillageVisitorType.STANDARD &&
				!isProceduralTask &&
				!restrictToMercsIds.includes(refMerc.id)
			) {
				return null;
			}

			const title = replacePlaceholders(task.title, task, visitor, referenceData, allCards);
			const description = replacePlaceholders(task.description, task, visitor, referenceData, allCards);

			const mercenaryCard = allCards.getCardFromDbfId(refMerc.cardDbfId);
			const mercenaryCardId = mercenaryCard.id;
			const role = getHeroRole(mercenaryCard.mercenaryRole);
			const result = {
				...visitor, // For debugging purpose
				ownerMercenaryDbfId: refMerc.cardDbfId,
				mercenaryCardId: mercenaryCardId,
				mercenaryRole: mercenaryCard.mercenaryRole,
				mercenaryName: mercenaryCard.name,
				title: title,
				header: isTaskChainStory(taskChain)
					? title
					: i18n.translateString('mercenaries.team-widget.task-title', {
							taskNumber: visitor.TaskChainProgress + 1,
							taskTitle: title,
					  }),
				description: description,
				progress: visitor.TaskProgress,
				quota: task.quota,
				progressPercentage: !!task.quota ? (100 * (visitor.TaskProgress ?? 0)) / task.quota : 0,
				taskChainProgress: visitor.TaskChainProgress,
				portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${mercenaryCardId}.jpg`,
				frameUrl: role
					? `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_${role}.png`
					: null,
				type: taskChain?.taskChainType ?? VillageVisitorType.PROCEDURAL,
				additionalMercDbfIds: visitor.AdditionalMercenaryIds?.map(
					(mercId) => referenceData.mercenaries.find((m) => m.id === mercId)?.cardDbfId,
				),
			} as Task;
			return result;
		})
		.filter((task) => !!task)
		.sort((a, b) => {
			// Keep the interesting tasks at the top (so they are focused when showing the widget)
			if (a.type === VillageVisitorType.PROCEDURAL && b.type != VillageVisitorType.PROCEDURAL) {
				return 1;
			}
			if (a.type !== VillageVisitorType.PROCEDURAL && b.type !== VillageVisitorType.PROCEDURAL) {
				return -1;
			}
			if (a.type === VillageVisitorType.EVENT && b.type != VillageVisitorType.EVENT) {
				return 1;
			}
			if (a.type !== VillageVisitorType.EVENT && b.type !== VillageVisitorType.EVENT) {
				return -1;
			}
			if (a.type === VillageVisitorType.SPECIAL && b.type != VillageVisitorType.SPECIAL) {
				return 1;
			}
			if (a.type !== VillageVisitorType.SPECIAL && b.type !== VillageVisitorType.SPECIAL) {
				return -1;
			}
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
		});
};

const replacePlaceholders = (
	rawText: string,
	task: MercenariesReferenceData['taskChains'][0]['tasks'][0],
	visitor: MemoryVisitor,
	referenceData: MercenariesReferenceData,
	allCards: CardsFacadeService,
): string => {
	return rawText
		.replace(
			'$owner_merc',
			getShortMercHeroName(
				referenceData.mercenaries.find((m) => m.id === visitor.ProceduralMercenaryId)?.cardDbfId,
				allCards,
			),
		)
		.replace(
			'$bounty_set',
			referenceData.bountySets.find((set) => set.bounties.some((b) => b.id === visitor.ProceduralBountyId))?.name,
		)
		.replace(
			'$bounty_nd',
			referenceData.bountySets.flatMap((set) => set.bounties).find((b) => b.id === visitor.ProceduralBountyId)
				?.name,
		)
		.replace(
			'$additional_mercs',

			visitor.AdditionalMercenaryIds?.map((mercId) =>
				getShortMercHeroName(referenceData.mercenaries.find((m) => m.id === mercId)?.cardDbfId, allCards),
			).join(', '),
		);
};

const isTaskChainStory = (taskChain: MercenariesReferenceData['taskChains'][0]): boolean => {
	return (
		taskChain == null ||
		(taskChain.taskChainType === VillageVisitorType.SPECIAL && taskChain.mercenaryVisitorId === 1938)
	);
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
