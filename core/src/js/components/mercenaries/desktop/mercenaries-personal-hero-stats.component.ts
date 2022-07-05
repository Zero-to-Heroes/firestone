import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { MercenarySelector, RarityTYpe, RewardItemType, TaskStatus } from '@firestone-hs/reference-data';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { MemoryVisitor } from '../../../models/memory/memory-mercenaries-collection-info';
import { MemoryMercenary } from '../../../models/memory/memory-mercenaries-info';
import { MercenariesFullyUpgradedFilterType } from '../../../models/mercenaries/mercenaries-filter-types';
import {
	MercenariesPersonalHeroesSortCriteria,
	MercenariesPersonalHeroesSortCriteriaType,
} from '../../../models/mercenaries/personal-heroes-sort-criteria.type';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { MercenariesPersonalHeroesSortEvent } from '../../../services/mainwindow/store/events/mercenaries/mercenaries-personal-heroes-sort-event';
import { MercenariesReferenceData } from '../../../services/mercenaries/mercenaries-state-builder.service';
import { getHeroRole, normalizeMercenariesCardId } from '../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { applySearchStringFilter, buildBounties } from '../../../services/ui-store/mercenaries-ui-helper';
import { areDeepEqual, sumOnArray } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-personal-hero-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-personal-hero-stats.component.scss`,
	],
	template: `
		<div class="mercenaries-personal-hero-stats" *ngIf="stats$ | async as stats; else emptyState">
			<div class="header" *ngIf="sortCriteria$ | async as sort">
				<sortable-label
					class="level"
					[name]="'mercenaries.hero-stats.level-header' | owTranslate"
					[sort]="sort"
					[criteria]="'level'"
				>
				</sortable-label>
				<sortable-label
					class="role"
					[name]="'mercenaries.hero-stats.role-header' | owTranslate"
					[sort]="sort"
					[criteria]="'role'"
				>
				</sortable-label>
				<sortable-label
					class="name"
					[name]="'mercenaries.hero-stats.name-header' | owTranslate"
					[sort]="sort"
					[criteria]="'name'"
				>
				</sortable-label>
				<sortable-label
					class="xp"
					[name]="'mercenaries.hero-stats.xp-header' | owTranslate"
					[sort]="sort"
					[criteria]="'xp-in-level'"
				>
				</sortable-label>
				<sortable-label
					class="coins left"
					[name]="'mercenaries.hero-stats.coins-left-header' | owTranslate"
					[sort]="sort"
					[criteria]="'coins-left'"
					[helpTooltip]="'mercenaries.hero-stats.coins-left-header-tooltip' | owTranslate"
				>
				</sortable-label>
				<sortable-label
					class="coins needed"
					[name]="'mercenaries.hero-stats.coins-needed-header' | owTranslate"
					[sort]="sort"
					[criteria]="'coins-needed-to-max'"
					[helpTooltip]="'mercenaries.hero-stats.coins-needed-header-tooltip' | owTranslate"
				>
				</sortable-label>
				<sortable-label
					class="coins to-farm"
					[name]="'mercenaries.hero-stats.coins-to-farm-header' | owTranslate"
					[sort]="sort"
					[criteria]="'coins-to-farm-to-max'"
					[helpTooltip]="'mercenaries.hero-stats.coins-to-farm-header-tooltip' | owTranslate"
				>
				</sortable-label>
				<sortable-label
					class="tasks"
					[name]="'mercenaries.hero-stats.completed-tasks-header' | owTranslate"
					[sort]="sort"
					[criteria]="'task-progress'"
					[helpTooltip]="'mercenaries.hero-stats.completed-tasks-header-tooltip' | owTranslate"
				>
				</sortable-label>
				<sortable-label
					class="abilities"
					[name]="'mercenaries.hero-stats.abilities-header' | owTranslate"
					[isSortable]="false"
				>
				</sortable-label>
				<sortable-label
					class="equipments"
					[name]="'mercenaries.hero-stats.equipments-header' | owTranslate"
					[isSortable]="false"
				>
				</sortable-label>
			</div>
			<div class="list" scrollable>
				<mercenaries-personal-hero-stat
					*ngFor="let stat of stats; trackBy: trackByFn"
					[stat]="stat"
				></mercenaries-personal-hero-stat>
			</div>
		</div>
		<ng-template #emptyState>
			<mercenaries-empty-state
				[subtitle]="'mercenaries.hero-stats.empty-state-subtitle' | owTranslate"
			></mercenaries-empty-state
		></ng-template>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesPersonalHeroStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly PersonalHeroStat[]>;
	sortCriteria$: Observable<MercenariesPersonalHeroesSortCriteria>;

	private unsortedStats$: Observable<readonly PersonalHeroStat[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.sortCriteria$ = this.store
			.listen$(([main, nav, prefs]) => prefs.mercenariesPersonalHeroesSortCriteria)
			.pipe(
				map(([sortCriteria]) => sortCriteria[0]),
				filter((sortCriteria) => !!sortCriteria),
				distinctUntilChanged((a, b) => a?.criteria == b?.criteria && a?.direction == b?.direction),
				tap((filter) =>
					setTimeout(() => {
						if (!(this.cdr as ViewRef)?.destroyed) {
							this.cdr.detectChanges();
						}
					}, 0),
				),
				tap((info) => cdLog('emitting sortCriteria in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.unsortedStats$ = this.store
			.listen$(
				([main, nav]) => main.mercenaries.getReferenceData(),
				([main, nav]) => main.mercenaries.collectionInfo,
			)
			.pipe(
				filter(([referenceData, collectionInfo]) => !!referenceData && !!collectionInfo),
				this.mapData(([referenceData, collectionInfo]) =>
					collectionInfo.Mercenaries.map((memMerc) =>
						this.buildMercenaryStat(memMerc, referenceData, collectionInfo.Visitors),
					).filter((stat) => stat),
				),
			);
		this.stats$ = combineLatest(
			this.unsortedStats$,
			this.store.listen$(
				([main, nav, prefs]) => main.mercenaries.getReferenceData(),
				([main, nav, prefs]) => prefs.mercenariesPersonalHeroesSortCriteria,
				([main, nav, prefs]) => prefs.mercenariesActiveFullyUpgradedFilter,
				([main, nav, prefs]) => nav.navigationMercenaries.heroSearchString,
			),
		).pipe(
			filter(
				([stats, [referenceData, sortCriteria, fullyUpgraded, heroSearchString]]) =>
					!!stats?.length && !!referenceData,
			),
			distinctUntilChanged((a, b) => areDeepEqual(a, b)),
			this.mapData(([stats, [referenceData, sortCriteria, fullyUpgraded, heroSearchString]]) =>
				this.sortPersonalHeroStats(stats, heroSearchString, fullyUpgraded, sortCriteria, referenceData),
			),
		);
	}

	private buildMercenaryStat(
		memMerc: MemoryMercenary,
		referenceData: MercenariesReferenceData,
		visitors: readonly MemoryVisitor[],
	): PersonalHeroStat {
		const refMerc = referenceData.mercenaries.find((m) => m.id === memMerc.Id);
		if (!refMerc) {
			return null;
		}
		// const debug = refMerc.name === 'Chi-Ji';
		const mercenaryCard = this.allCards.getCardFromDbfId(refMerc.cardDbfId);
		const taskChain = referenceData.taskChains
			.filter((chain) => chain.mercenaryId === refMerc.id)
			.map((chain) => ({
				...chain,
				// The last 2 tasks are present in the ref data, but not activated in-game
				tasks: chain.tasks.slice(0, 18),
			}))[0];
		// debug && console.debug('taskChain', taskChain);
		// Can have only one task per mercenary at the same time
		const visitorInfo = visitors.find((v) => v.VisitorId === taskChain?.mercenaryVisitorId);
		const currentTaskStep = visitorInfo?.TaskChainProgress;
		const currentStep = !visitorInfo
			? null
			: visitorInfo.Status === TaskStatus.CLAIMED || visitorInfo.Status === TaskStatus.COMPLETE
			? Math.min(taskChain.tasks.length, currentTaskStep + 1)
			: Math.max(0, currentTaskStep);
		// debug && console.debug('currentTaskStep', refMerc.name, currentTaskStep, currentStep, visitorInfo, taskChain);

		const currentTaskDescription = this.buildTaskDescription(taskChain, currentStep, visitorInfo);
		const lastLevel = [...referenceData.mercenaryLevels].pop();
		const isMaxLevel = memMerc.Level === lastLevel.currentLevel;
		const abilities = this.buildAbilities(refMerc, memMerc);
		const equipments = this.buildEquipments(refMerc, memMerc);
		const bountiesForMerc: readonly BountyForMerc[] = buildBounties(refMerc, referenceData.bountySets);

		const totalCoinsForFullUpgrade =
			sumOnArray(abilities, (a) => a.coinsToCraft) + sumOnArray(equipments, (e) => e.coinsToCraft);
		const totalCoinsLeft = memMerc.CurrencyAmount;

		const coinsMissingFromTasks = taskChain.tasks
			.filter((task, index) => index >= (currentStep ?? -1))
			.flatMap((task) => task.rewards)
			.filter((task) => task)
			.filter(
				(task) =>
					task.type === RewardItemType.MERCENARY_CURRENCY &&
					task.mercenarySelector === MercenarySelector.CONTEXT,
			)
			.map((task) => task.quantity)
			.reduce((a, b) => a + b, 0);

		return {
			mercenaryId: refMerc.id,
			owned: memMerc.Owned,
			cardId: mercenaryCard.id,
			premium: memMerc.Premium,
			rarity: memMerc.Rarity,
			name: mercenaryCard.name,
			role: getHeroRole(mercenaryCard.mercenaryRole),
			currentLevel: memMerc.Level,
			totalXp: memMerc.Experience,
			isMaxLevel: isMaxLevel,
			isFullyUpgraded: memMerc.IsFullyUpgraded,
			xpNeededForLevel: isMaxLevel
				? 0
				: memMerc.Level === 30
				? null
				: referenceData.mercenaryLevels.find((info) => info.currentLevel === memMerc.Level + 1)?.xpToNext -
				  memMerc.Experience,
			xpInCurrentLevel: isMaxLevel
				? lastLevel.xpToNext
				: memMerc.Level <= 1
				? memMerc.Experience
				: memMerc.Experience -
				  referenceData.mercenaryLevels.find((info) => info.currentLevel === memMerc.Level)?.xpToNext,
			abilities: abilities,
			equipments: equipments,
			minCostOfNextUpgrade: null,

			totalCoinsForFullUpgrade: totalCoinsForFullUpgrade,
			totalCoinsLeft: totalCoinsLeft,
			totalCoinsNeeded: Math.max(0, totalCoinsForFullUpgrade - totalCoinsLeft),
			coinsMissingFromTasks: coinsMissingFromTasks,
			totalCoinsToFarm: Math.max(0, totalCoinsForFullUpgrade - totalCoinsLeft - coinsMissingFromTasks),

			totalTasks: taskChain?.tasks.length,
			// Because human-readable starts at 1
			currentTask: currentStep,
			currentTaskDescription: currentTaskDescription,
			bountiesWithRewards: bountiesForMerc,
		} as PersonalHeroStat;
	}

	private buildEquipments(
		refMerc: MercenariesReferenceData['mercenaries'][0],
		memMerc: MemoryMercenary,
	): readonly PersonalHeroStatEquipment[] {
		return refMerc.equipments.map((info) => {
			const memEquip = memMerc.Equipments.find((e) => e.Id === info.equipmentId);
			const refEquip = refMerc.equipments.find((a) => a.equipmentId === info.equipmentId);

			const baseEquipmentCard = this.allCards.getCardFromDbfId(info.cardDbfId);

			const currentUnlockedTier = memEquip?.Tier ?? 0;
			const coinsToCraft = refEquip.tiers
				.filter((a) => a.tier > currentUnlockedTier)
				.map((tier) => tier.coinCraftCost)
				.reduce((a, b) => a + b, 0);
			const cardDbfId = refEquip.tiers.find((tier) => tier.tier === currentUnlockedTier)?.cardDbfId;
			const equipmentCard = this.allCards.getCardFromDbfId(cardDbfId);
			// console.debug(
			// 	'equipments',
			// 	refMerc.name,
			// 	equipmentCard.name,
			// 	equipmentCard,
			// 	baseEquipmentCard,
			// 	refEquip,
			// 	memEquip,
			// );
			return {
				cardId: equipmentCard.id ?? baseEquipmentCard.id,
				coinsToCraft: coinsToCraft,
				tier:
					currentUnlockedTier > 0
						? refEquip.tiers?.length === 1
							? // For some reason a few single-tier equipments are stored as tier 1 instead of tier 4, so we manually correct this
							  4
							: currentUnlockedTier
						: currentUnlockedTier,
				owned: !!memEquip?.Owned,
				isEquipped: !!memEquip ? memEquip.Equipped : false,
			};
		});
	}

	private buildAbilities(
		refMerc: MercenariesReferenceData['mercenaries'][0],
		memMerc: MemoryMercenary,
	): readonly PersonalHeroStatAbility[] {
		return refMerc.abilities
			.filter((info) => info)
			.map((info) => {
				const baseAbilityCard = this.allCards.getCardFromDbfId(info.cardDbfId);
				const memAbility = memMerc.Abilities.find(
					(a) => normalizeMercenariesCardId(a.CardId) === normalizeMercenariesCardId(baseAbilityCard.id),
				);
				const refAbility = refMerc.abilities.find((a) => a.abilityId === info.abilityId);

				const memAbilityCard = this.allCards.getCard(memAbility?.CardId);

				const currentUnlockedTier = memAbility?.Tier ?? 0;
				const coinsToCraft = refAbility.tiers
					.filter((a) => a.tier > currentUnlockedTier)
					.map((tier) => tier.coinCraftCost)
					.reduce((a, b) => a + b, 0);
				const cardDbfId = refAbility.tiers.find((tier) => tier.tier === currentUnlockedTier)?.cardDbfId;
				const abilityCard = this.allCards.getCardFromDbfId(cardDbfId);
				return {
					cardId: abilityCard.id ?? memAbilityCard.id ?? baseAbilityCard.id,
					tier: currentUnlockedTier,
					coinsToCraft: coinsToCraft,
					owned: !!memAbility,
					speed: abilityCard.cost ?? memAbilityCard.cost ?? baseAbilityCard.cost,
					cooldown:
						abilityCard.mercenaryAbilityCooldown ??
						memAbilityCard.mercenaryAbilityCooldown ??
						baseAbilityCard.mercenaryAbilityCooldown,
				};
			});
	}

	private buildTaskDescription(
		taskChain: {
			// The last 2 tasks are present in the ref data, but not activated in-game
			tasks: { readonly id: number; readonly title: string; readonly description: string }[];
			id: number;
			mercenaryId: number;
			mercenaryVisitorId: number;
		},
		currentStep: number,
		visitorInfo: MemoryVisitor,
	): string {
		if (currentStep == null) {
			return null;
		}

		const sortedTasks = [...(taskChain?.tasks ?? [])].sort((a, b) => a.id - b.id);
		const currentTask = sortedTasks[currentStep];
		// console.debug('currentTask', taskChain.mercenaryVisitorId, taskChain.mercenaryId, currentTask);
		if (!currentTask) {
			return null;
		}

		const isTaskOngoing =
			visitorInfo?.TaskChainProgress === currentStep &&
			(visitorInfo?.Status === TaskStatus.ACTIVE || visitorInfo?.Status === TaskStatus.NEW);
		// console.debug('isTaskOngoing', isTaskOngoing, visitorInfo, currentStep);
		const taskLabel = isTaskOngoing
			? this.i18n.translateString(`mercenaries.hero-stats.current-task-tooltip-title`, {
					taskNumber: currentStep + 1,
					taskTitle: currentTask.title,
			  })
			: this.i18n.translateString(`mercenaries.hero-stats.next-task-tooltip-title`, {
					taskNumber: currentStep + 1,
					taskTitle: currentTask.title,
			  });

		const currentTaskDescription = `
				<div class="current-task">
					<div class="title">${taskLabel}</div>
					<div class="description">${currentTask.description}</div>
				</div>
		`;
		let nextTaskDescription = '';
		if (isTaskOngoing && currentStep + 1 < sortedTasks.length) {
			const nextTask = sortedTasks[currentStep + 1];
			nextTaskDescription = `
				<div class="next-task">
					<div class="title"> ${this.i18n.translateString(`mercenaries.hero-stats.next-task-tooltip-title`, {
						taskNumber: currentStep + 2,
						taskTitle: nextTask.title,
					})}</div>
					<div class="description">${nextTask.description}</div>
				</div>
			`;
		}

		const taskDescription = `
			<div class="container">
				${currentTaskDescription}
				${nextTaskDescription}
			</div>
		`;
		return taskDescription;
	}

	trackByFn(index: number, item: PersonalHeroStat) {
		return item.mercenaryId;
	}

	private sortPersonalHeroStats(
		stats: readonly PersonalHeroStat[],
		heroSearchString: string,
		fullyUpgraded: MercenariesFullyUpgradedFilterType,
		sortCriteria: readonly MercenariesPersonalHeroesSortCriteria[],
		referenceData: MercenariesReferenceData,
	): readonly PersonalHeroStat[] {
		const currentSorted = stats
			.filter((stat) => applySearchStringFilter(stat.cardId, heroSearchString, this.allCards, referenceData))
			.filter((stat) =>
				fullyUpgraded === 'all'
					? true
					: fullyUpgraded === 'upgraded'
					? stat.isFullyUpgraded
					: !stat.isFullyUpgraded,
			)
			// So that minions that you own are always displayed above the ones you don't have in case of ties
			.sort((a, b) => {
				if (a.owned && !b.owned) {
					return -1;
				}
				if (!a.owned && b.owned) {
					return 1;
				}
				return 0;
			})
			.sort(this.applySortCriteria(sortCriteria[0]));
		return currentSorted;
	}

	private buildCompare(
		direction: 'asc' | 'desc',
		extractor: (a: PersonalHeroStat) => number | string,
	): (a: PersonalHeroStat, b: PersonalHeroStat) => number {
		if (direction === 'desc') {
			return (a: PersonalHeroStat, b: PersonalHeroStat) => {
				if (extractor(a) > extractor(b)) {
					return -1;
				} else if (extractor(a) < extractor(b)) {
					return 1;
				} else {
					return 0;
				}
			};
		} else {
			return (a: PersonalHeroStat, b: PersonalHeroStat) => {
				if (extractor(a) < extractor(b)) {
					return -1;
				} else if (extractor(a) > extractor(b)) {
					return 1;
				} else {
					return 0;
				}
			};
		}
	}

	private applySortCriteria(
		criteria: MercenariesPersonalHeroesSortCriteria,
	): (a: PersonalHeroStat, b: PersonalHeroStat) => number {
		switch (criteria.criteria) {
			case 'level':
				return this.buildCompare(criteria.direction, (a) => a.totalXp);
			case 'role':
				return this.buildCompare(criteria.direction, (a) => a.role);
			case 'name':
				return this.buildCompare(criteria.direction, (a) => a.name);
			case 'xp-in-level':
				return this.buildCompare(criteria.direction, (a) => this.progressBar(a));
			case 'coins-left':
				return this.buildCompare(criteria.direction, (a) => a.totalCoinsLeft);
			case 'coins-needed-to-max':
				return this.buildCompare(criteria.direction, (a) => a.totalCoinsNeeded);
			case 'coins-to-farm-to-max':
				return this.buildCompare(criteria.direction, (a) => a.totalCoinsToFarm);
			case 'task-progress':
				return this.buildCompare(criteria.direction, (a) => a.currentTask);
		}
	}

	private progressBar(a: PersonalHeroStat): number {
		return !!a.xpNeededForLevel ? a.xpInCurrentLevel / a.xpNeededForLevel : -1;
	}
}

@Component({
	selector: 'sortable-label',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/sortable-label.component.scss`,
	],
	template: `
		<div
			class="sortable-label"
			[ngClass]="{
				'sortable': _isSortable,
				'active-asc': _sort?.criteria === _criteria && _sort?.direction === 'asc',
				'active-desc': _sort?.criteria === _criteria && _sort?.direction === 'desc'
			}"
			(click)="startSort()"
		>
			<div class="label">
				<span>{{ _name }}</span>
				<svg class="caret svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#arrow" />
				</svg>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortableLabelComponent {
	@Input() set name(value: string) {
		this._name = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set criteria(value: MercenariesPersonalHeroesSortCriteriaType) {
		this._criteria = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set sort(value: MercenariesPersonalHeroesSortCriteria) {
		this._sort = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set isSortable(value: boolean) {
		this._isSortable = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	_name: string;
	_criteria: MercenariesPersonalHeroesSortCriteriaType;
	_isSortable = true;
	_sort: MercenariesPersonalHeroesSortCriteria;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly store: AppUiStoreFacadeService) {}

	startSort() {
		if (!this._isSortable) {
			return;
		}
		this.store.send(new MercenariesPersonalHeroesSortEvent(this._criteria));
	}
}

export interface PersonalHeroStat {
	readonly mercenaryId: number;
	readonly cardId: string;
	readonly owned: boolean;
	readonly premium: number;
	readonly name: string;
	readonly rarity: RarityTYpe;
	readonly role: string;
	readonly currentLevel: number;
	readonly isMaxLevel: boolean;
	readonly isFullyUpgraded: boolean;
	readonly totalXp: number;
	readonly xpNeededForLevel: number;
	readonly xpInCurrentLevel: number;
	readonly totalCoinsLeft: number;
	readonly totalCoinsNeeded: number;
	readonly totalCoinsForFullUpgrade: number;
	readonly coinsMissingFromTasks: number;
	readonly totalCoinsToFarm: number;
	readonly minCostOfNextUpgrade: number;
	readonly abilities: readonly PersonalHeroStatAbility[];
	readonly equipments: readonly PersonalHeroStatEquipment[];
	readonly totalTasks: number;
	readonly currentTask: number;
	readonly currentTaskDescription: string;
	readonly bountiesWithRewards: BountyForMerc[];
}

export interface PersonalHeroStatAbility {
	readonly cardId: string;
	readonly owned: boolean;
	readonly tier: number;
	readonly speed: number;
	readonly cooldown: number;
	readonly coinsToCraft: number;
}

export interface PersonalHeroStatEquipment {
	readonly cardId: string;
	readonly owned: boolean;
	readonly tier: number;
	readonly isEquipped: boolean;
	readonly coinsToCraft: number;
}

export interface BountyForMerc {
	readonly bountySetName: string;
	readonly bountyName: string;
	readonly sortOrder: number;
}
