import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Achievement } from '../../models/achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { IndexedVisualAchievement } from '../../models/indexed-visual-achievement';
import { CompletionStep, VisualAchievement } from '../../models/visual-achievement';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import { ApiRunner } from '../api-runner';
import { AchievementsInitEvent } from '../mainwindow/store/events/achievements/achievements-init-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../overwolf.service';
import { AchievementsLoaderService } from './data/achievements-loader.service';
import { RemoteAchievementsService } from './remote-achievements.service';

const CATEGORIES_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/achievements/configuration';

@Injectable()
export class AchievementsRepository {
	public modulesLoaded = new BehaviorSubject<boolean>(false);

	private categories: readonly VisualAchievementCategory[];
	private storeUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private remoteAchievements: RemoteAchievementsService,
		private achievementsLoader: AchievementsLoaderService,
		private ow: OverwolfService,
		private api: ApiRunner,
	) {
		this.init();
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if ((res.gameChanged || res.runningChanged) && (await this.ow.inGame())) {
				const allAchievements: readonly Achievement[] = await this.achievementsLoader.getAchievements();
				const completedAchievements: readonly CompletedAchievement[] = await this.remoteAchievements.reloadFromMemory();
				// const [allAchievements, completedAchievements] = await Promise.all([
				// 	this.achievementsLoader.getAchievements(),
				// 	this.remoteAchievements.reloadFromMemory(),
				// ]);
				const mergedAchievements = this.mergeAchievements(allAchievements, completedAchievements);
				this.categories = await this.buildCategories(mergedAchievements);
				this.storeUpdater.next(new AchievementsInitEvent(this.categories));
			}
		});
		setTimeout(() => {
			this.storeUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async getTopLevelCategories(): Promise<readonly VisualAchievementCategory[]> {
		await this.waitForInit();
		return this.categories;
	}

	private async init() {
		const [[allAchievements, challenges], completedAchievements] = await Promise.all([
			this.achievementsLoader.initializeAchievements(),
			this.remoteAchievements.loadAchievements(),
		]);
		const mergedAchievements = this.mergeAchievements(allAchievements, completedAchievements);
		this.categories = await this.buildCategories(mergedAchievements);
		console.log('[achievements-repository] achievements initialised');
		this.modulesLoaded.next(true);
	}

	private mergeAchievements(
		allAchievements: readonly Achievement[],
		completedAchievements?: readonly CompletedAchievement[],
	): readonly VisualAchievement[] {
		const mergedAchievements: readonly Achievement[] = !completedAchievements
			? allAchievements
			: allAchievements.map((ref: Achievement) => {
					const completedAchievement = completedAchievements.filter(compl => compl.id === ref.id).pop();
					const numberOfCompletions = completedAchievement ? completedAchievement.numberOfCompletions : 0;
					return Object.assign(new Achievement(), ref, {
						numberOfCompletions: numberOfCompletions,
					} as Achievement);
			  });
		// console.log('[perf] getting full achievements');
		const fullAchievements: VisualAchievement[] = mergedAchievements
			.filter(achievement => this.isAchievementVisualRoot(achievement))
			.map((achievement, index) => this.convertToVisual(achievement, index, mergedAchievements))
			.map(obj => obj.achievement)
			.sort((a, b) => {
				if (a.id < b.id) {
					return -1;
				}
				if (a.id > b.id) {
					return 1;
				}
				return 0;
			});
		// console.log('[perf] returning result');
		return fullAchievements;
	}

	private convertToVisual(
		achievement: Achievement,
		index: number,
		allAchievements: readonly Achievement[],
	): IndexedVisualAchievement {
		const achievementForCompletionSteps: Achievement[] = allAchievements
			.filter(achv => achv.type === achievement.type)
			.sort((a, b) => a.priority - b.priority);
		let text = achievement.text || achievement.emptyText;
		const [completionSteps, textFromStep] = AchievementsRepository.buildCompletionSteps(
			achievementForCompletionSteps,
			achievement,
			text,
		);
		text = text || textFromStep;
		return {
			achievement: VisualAchievement.create({
				id: achievement.id,
				name: achievement.name,
				type: achievement.type,
				cardId: achievement.displayCardId,
				cardType: achievement.displayCardType,
				text: text,
				completionSteps: completionSteps,
			} as VisualAchievement),
			index: index,
		};
	}

	private async buildCategories(
		achievements: readonly VisualAchievement[],
	): Promise<readonly VisualAchievementCategory[]> {
		const categoryConfiguration: AchievementConfiguration = await this.loadConfiguration();

		return categoryConfiguration.categories.map(category => this.buildCategory(category, achievements));
	}

	private async loadConfiguration(): Promise<AchievementConfiguration> {
		const config: any = await this.api.callGetApiWithRetries(`${CATEGORIES_CONFIG_URL}/_configuration.json?v=9`);
		const fileNames: readonly string[] = config.categories;
		const categories: readonly AchievementCategoryConfiguration[] = (await Promise.all(
			fileNames.map(fileName => this.api.callGetApiWithRetries(`${CATEGORIES_CONFIG_URL}/${fileName}.json?v=15`)),
		)) as any;
		return {
			categories: categories,
		};
	}

	private buildCategory(
		category: AchievementCategoryConfiguration,
		achievements: readonly VisualAchievement[],
	): VisualAchievementCategory {
		return VisualAchievementCategory.create({
			id: category.id,
			name: category.name,
			icon: category.icon,
			achievements: this.buildAchievements(category.achievementTypes, achievements),
			categories:
				(category.categories?.map(cat =>
					this.buildCategory(cat, achievements),
				) as readonly VisualAchievementCategory[]) || [],
		} as VisualAchievementCategory);
	}

	private buildAchievements(
		achievementTypes: readonly string[],
		achievements: readonly VisualAchievement[],
	): readonly VisualAchievement[] {
		if (!achievementTypes) {
			return [];
		}
		return achievements.filter(ach => achievementTypes.includes(ach.type));
	}

	public static buildCompletionSteps(
		achievementForCompletionSteps: readonly (Achievement | CompletionStep)[],
		achievement: Achievement,
		text: string,
	): [readonly CompletionStep[], string] {
		const areProgressionSteps =
			achievementForCompletionSteps
				.map(achv => achv.priority)
				.filter((value, index, self) => self.indexOf(value) === index).length !== 1;
		// console.log('[completion-steps] areProgressionSteps', areProgressionSteps);
		const invertedCompletionSteps = [];
		let alreadyDefinedText = achievement.text || false;
		// Useful to make sure we have some consistency in the number of comletions
		let maxNumberOfCompletions = 0;
		for (let i = achievementForCompletionSteps.length - 1; i >= 0; i--) {
			const achv = achievementForCompletionSteps[i];
			// console.log('[completion-steps] handling step', achv);
			const completions: number = areProgressionSteps
				? Math.max(maxNumberOfCompletions, achv.numberOfCompletions)
				: achv.numberOfCompletions;
			// console.log('[completion-steps] completions', completions);
			maxNumberOfCompletions = completions;
			if (completions > 0 && !alreadyDefinedText) {
				text = achv.completedText;
				alreadyDefinedText = true;
			}
			invertedCompletionSteps.push({
				id: `${achv.id}`,
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
		// console.log('[completion-steps] invertedCompletionSteps', invertedCompletionSteps);
		return [invertedCompletionSteps.reverse() as readonly CompletionStep[], text];
	}

	private isAchievementVisualRoot(achievement: Achievement): boolean {
		return achievement.root;
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>(resolve => {
			const dbWait = () => {
				if (this.categories) {
					resolve();
				} else {
					// console.log('[achievement-repository] waiting for DB init');
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}

export interface AchievementConfiguration {
	categories: readonly AchievementCategoryConfiguration[];
}

export interface AchievementCategoryConfiguration {
	id: string;
	name: string;
	icon: string;
	categories?: readonly AchievementCategoryConfiguration[];
	achievementTypes?: readonly string[];
}
