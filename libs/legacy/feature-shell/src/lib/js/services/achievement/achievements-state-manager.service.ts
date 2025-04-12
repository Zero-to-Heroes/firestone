import { Injectable } from '@angular/core';
import { equalHsAchievementInfo, HsAchievementInfo } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { Achievement } from '../../models/achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { IndexedVisualAchievement } from '../../models/indexed-visual-achievement';
import { CompletionStep, VisualAchievement } from '../../models/visual-achievement';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import { AchievementsMemoryMonitor } from './data/achievements-memory-monitor.service';
import { FirestoneRemoteAchievementsLoaderService } from './data/firestone-remote-achievements-loader.service';
import { RawAchievementsLoaderService } from './data/raw-achievements-loader.service';

const CATEGORIES_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/achievements/configuration';

@Injectable()
export class AchievementsStateManagerService extends AbstractFacadeService<AchievementsStateManagerService> {
	// The achievements grouped by categories
	public groupedAchievements$$: SubscriberAwareBehaviorSubject<readonly VisualAchievementCategory[]>;
	// The achievement definitions loaded from the config and reference files
	public rawAchievements$$: SubscriberAwareBehaviorSubject<readonly Achievement[]>;

	// The current in-game progress for each achievement
	private achievementsInGameProgress$$ = new BehaviorSubject<readonly HsAchievementInfo[]>([]);
	// The Firestone achievements that have been completed
	private completedAchievements$$ = new BehaviorSubject<readonly CompletedAchievement[]>([]);

	private rawAchievementsLoader: RawAchievementsLoaderService;
	private remoteAchievementsLoader: FirestoneRemoteAchievementsLoaderService;
	private memoryMonitor: AchievementsMemoryMonitor;
	private api: ApiRunner;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'AchievementsStateManagerService', () => !!this.groupedAchievements$$);
	}

	protected override assignSubjects() {
		this.groupedAchievements$$ = this.mainInstance.groupedAchievements$$;
		this.rawAchievements$$ = this.mainInstance.rawAchievements$$;
	}

	protected async init() {
		this.groupedAchievements$$ = new SubscriberAwareBehaviorSubject<readonly VisualAchievementCategory[] | null>(
			null,
		);
		this.rawAchievements$$ = new SubscriberAwareBehaviorSubject<readonly Achievement[] | null>(null);
		this.rawAchievementsLoader = AppInjector.get(RawAchievementsLoaderService);
		this.remoteAchievementsLoader = AppInjector.get(FirestoneRemoteAchievementsLoaderService);
		this.memoryMonitor = AppInjector.get(AchievementsMemoryMonitor);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);

		this.groupedAchievements$$.onFirstSubscribe(async () => {
			console.debug('[achievements-state] subscriber to groupedAchievements$$');
			const categoryConfiguration: AchievementConfiguration = await this.loadConfiguration();
			combineLatest([this.rawAchievements$$, this.achievementsInGameProgress$$, this.completedAchievements$$])
				.pipe(
					filter(
						([rawAchievements, achievementsFromMemory, completedAchievements]) =>
							rawAchievements?.length > 0,
					),
					debounceTime(1000),
					distinctUntilChanged((a, b) => {
						if (!a || !b) {
							return false;
						}
						if (a[0]?.length !== b[0]?.length) {
							return false;
						}
						if (a[1]?.length !== b[1]?.length) {
							return false;
						}
						if (a[2]?.length !== b[2]?.length) {
							return false;
						}
						if (!a[1]?.every((aInGame, index) => equalHsAchievementInfo(aInGame, b[1]?.[index]))) {
							return false;
						}
						if (
							!a[2]?.every(
								(aCompleted, index) =>
									aCompleted.id === b[2]?.[index].id &&
									aCompleted.numberOfCompletions === b[2]?.[index].numberOfCompletions,
							)
						) {
							return false;
						}
						return true;
					}),
				)
				.subscribe(([rawAchievements, achievementsFromMemory, completedAchievements]) => {
					this.groupedAchievements$$.next(
						this.buildGroupedAchievements(
							rawAchievements,
							achievementsFromMemory,
							completedAchievements,
							categoryConfiguration,
						),
					);
				});

			this.remoteAchievementsLoader.remoteAchievements$$
				.pipe(filter((remoteAchievements) => !!remoteAchievements?.length))
				.subscribe((remoteAchievements) => {
					this.completedAchievements$$.next(remoteAchievements);
				});

			this.memoryMonitor.achievementsFromMemory$$
				.pipe(filter((inGameAchievements) => !!inGameAchievements?.length))
				.subscribe((inGameAchievements) => {
					this.achievementsInGameProgress$$.next(inGameAchievements);
				});
		});

		this.rawAchievements$$.onFirstSubscribe(async () => {
			console.debug('[achievements-state] loading raw achievement definitions');
			const [achievementDefinitions, _] = await Promise.all([
				this.loadAchievementDefinitions(),
				this.remoteAchievementsLoader.loadAchievements(),
			]);
			this.rawAchievements$$.next(
				achievementDefinitions.map((d) => ({
					...d,
					numberOfCompletions: 0,
				})),
			);
		});
	}

	private buildGroupedAchievements(
		rawAchievements: readonly Achievement[],
		achievementsFromMemory: readonly HsAchievementInfo[],
		completedAchievements: readonly CompletedAchievement[],
		categoryConfiguration: AchievementConfiguration,
	): readonly VisualAchievementCategory[] {
		const start = Date.now();
		const achievementsWithCompletion = addCompletionInfo(
			rawAchievements,
			completedAchievements,
			achievementsFromMemory,
		);
		const mergedAchievements = convertForDisplay(achievementsWithCompletion);
		const categories = buildCategories(mergedAchievements, categoryConfiguration);
		console.debug(
			'[achievements-state] built categories',
			categories,
			'in',
			Date.now() - start,
			'ms',
			achievementsWithCompletion.filter((a) => a.hsRewardTrackXp),
		);
		return categories;
	}

	private async loadAchievementDefinitions() {
		console.debug('[achievements-state] loading achievement definitions');
		const achievementDefinitions = await this.rawAchievementsLoader.loadRawAchievements();
		return achievementDefinitions;
	}

	private async loadConfiguration(): Promise<AchievementConfiguration> {
		const config: any = await this.api.callGetApi(`${CATEGORIES_CONFIG_URL}/_configuration.json`);
		const prefs = await this.prefs.getPreferences();
		const fileNames: readonly string[] = config?.categories ?? [];
		const categories: readonly AchievementCategoryConfiguration[] = (await Promise.all(
			fileNames.map((fileName) => {
				const locFileName = fileName === 'hearthstone_game' ? `hearthstone_game_${prefs.locale}` : fileName;
				return this.api.callGetApi(`${CATEGORIES_CONFIG_URL}/${locFileName}.json`);
			}),
		)) as any;
		return {
			categories: categories,
		};
	}
}

const buildCategories = (
	achievements: readonly VisualAchievement[],
	categoryConfiguration: AchievementConfiguration,
): readonly VisualAchievementCategory[] => {
	return categoryConfiguration.categories
		.filter((cat) => cat)
		.map((category) => buildCategory(category, achievements));
};

const buildCategory = (
	category: AchievementCategoryConfiguration,
	achievements: readonly VisualAchievement[],
): VisualAchievementCategory => {
	return VisualAchievementCategory.create({
		id: category.id,
		name: category.name,
		icon: category.icon,
		achievements: buildAchievements(category.achievementTypes, achievements),
		categories:
			(category.categories
				?.filter((cat) => cat)
				?.map((cat) => buildCategory(cat, achievements)) as readonly VisualAchievementCategory[]) || [],
	} as VisualAchievementCategory);
};

const buildAchievements = (
	achievementTypes: readonly string[],
	achievements: readonly VisualAchievement[],
): readonly VisualAchievement[] => {
	if (!achievementTypes) {
		return [];
	}
	return achievements.filter((ach) => achievementTypes.includes(ach.type));
};

const addCompletionInfo = (
	allAchievements: readonly Achievement[],
	completedAchievements: readonly CompletedAchievement[],
	achievementsFromMemory: readonly HsAchievementInfo[],
): readonly Achievement[] => {
	const achievementsWithCompletion = allAchievements.map((ref: Achievement) => {
		const completedAchievement = completedAchievements?.find((compl) => compl.id === ref.id);
		const achievementFromMemory = achievementsFromMemory?.find((ach) => ach.id === ref.hsAchievementId);
		let numberOfCompletions = completedAchievement ? completedAchievement.numberOfCompletions : 0;
		numberOfCompletions = numberOfCompletions > 0 ? numberOfCompletions : achievementFromMemory?.completed ? 1 : 0;
		const result = {
			...ref,
			numberOfCompletions: numberOfCompletions,
			progress: achievementFromMemory?.progress,
		} as Achievement;
		return result;
	});
	return achievementsWithCompletion;
};

const convertForDisplay = (achievementsWithCompletion: readonly Achievement[]): readonly VisualAchievement[] => {
	const fullAchievements: VisualAchievement[] = achievementsWithCompletion
		.filter((achievement) => isAchievementVisualRoot(achievement))
		.map((achievement, index) => convertToVisual(achievement, index, achievementsWithCompletion))
		.map((obj) => obj.achievement)
		.sort((a, b) => {
			if (a.id < b.id) {
				return -1;
			}
			if (a.id > b.id) {
				return 1;
			}
			return 0;
		});

	return fullAchievements;
};

const isAchievementVisualRoot = (achievement: Achievement): boolean => {
	return achievement.root;
};

const convertToVisual = (
	achievement: Achievement,
	index: number,
	allAchievements: readonly Achievement[],
): IndexedVisualAchievement => {
	const achievementForCompletionSteps: Achievement[] = allAchievements
		.filter((achv) => achv.type === achievement.type)
		.sort((a, b) => a.priority - b.priority);
	let text = achievement.text || achievement.emptyText;
	const [completionSteps, textFromStep] = buildCompletionSteps(achievementForCompletionSteps, achievement, text);
	text = text || textFromStep;
	return {
		achievement: VisualAchievement.create({
			id: achievement.id,
			name: achievement.name,
			type: achievement.type,
			hsAchievementId: achievement.hsAchievementId,
			hsSectionId: achievement.hsSectionId,
			hsRewardTrackXp: achievement.hsRewardTrackXp,
			cardId: achievement.displayCardId,
			cardType: achievement.displayCardType,
			text: text,
			completionSteps: completionSteps,
		} as VisualAchievement),
		index: index,
	};
};

export const buildCompletionSteps = (
	achievementForCompletionSteps: readonly (Achievement | CompletionStep)[],
	achievement: Achievement,
	text: string,
): [readonly CompletionStep[], string] => {
	const areProgressionSteps =
		achievementForCompletionSteps
			.map((achv) => achv.priority)
			.filter((value, index, self) => self.indexOf(value) === index).length !== 1;

	const invertedCompletionSteps = [];
	let alreadyDefinedText = achievement.text || false;
	// Useful to make sure we have some consistency in the number of comletions
	let maxNumberOfCompletions = 0;
	for (let i = achievementForCompletionSteps.length - 1; i >= 0; i--) {
		const achv = achievementForCompletionSteps[i];

		const completions: number = areProgressionSteps
			? Math.max(maxNumberOfCompletions, achv.numberOfCompletions)
			: achv.numberOfCompletions;

		maxNumberOfCompletions = completions;
		if (completions > 0 && !alreadyDefinedText) {
			text = achv.completedText;
			alreadyDefinedText = true;
		}
		invertedCompletionSteps.push({
			id: `${achv.id}`,
			hsAchievementId: achv.hsAchievementId,
			progress: achv.progress,
			numberOfCompletions: areProgressionSteps ? completions : achv.numberOfCompletions,
			icon: achv.icon,
			completedText: achv.completedText,
			priority: achv.priority,
			text(showTimes = false): string {
				const times = ``;
				return `${achv.completedText} <span class="number-of-times">${times}</span>`;
			},
		} as CompletionStep);
	}

	return [invertedCompletionSteps.reverse() as readonly CompletionStep[], text];
};

interface AchievementConfiguration {
	categories: readonly AchievementCategoryConfiguration[];
}

interface AchievementCategoryConfiguration {
	id: string;
	name: string;
	icon: string;
	categories?: readonly AchievementCategoryConfiguration[];
	achievementTypes?: readonly string[];
}
