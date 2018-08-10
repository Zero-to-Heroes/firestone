import { Injectable } from '@angular/core';

import { CompletedAchievement } from '../../models/completed-achievement';
import { AchievementSet } from '../../models/achievement-set';
import { Achievement } from '../../models/achievement';

import { IndexedDbService } from './indexed-db.service';
import { AchievementsRepository } from './achievements-repository.service';
import { Events } from '../events.service';

@Injectable()
export class AchievementsStorageService {

	constructor(
		private events: Events,
		private repository: AchievementsRepository,
		private indexedDb: IndexedDbService) {
	}

	public loadAchievement(achievementId: string, callback: Function) {
		this.indexedDb.getAchievement(achievementId, (result: CompletedAchievement) => {
			callback(result);
		});
	}

	public saveAchievement(achievement: CompletedAchievement, callback: Function) {
		this.indexedDb.save(achievement, (result) => {
			callback(result);
		})
	}

	public loadAchievements(callback: Function) {
		this.indexedDb.getAll((result) => {
			callback(result);
		})
	}

	public loadAggregatedAchievements(): Promise<AchievementSet[]> {
		// console.log('loading aggregated achievements');
		return new Promise((resolve, reject) => {
			this.loadAchievements((achievements: CompletedAchievement[]) => {
				// console.log('loaded completed achievements', achievements);
				const achievementSets = this.repository.getAchievementSets();
				// console.log('loaded achievement sets', achievementSets);
				const aggregatedAchievementSets: AchievementSet[] = achievementSets.map((achievementSet) => this.aggregateAchievementSet(achievementSet, achievements));
				resolve(aggregatedAchievementSets);
			})
		})
	}

	private aggregateAchievementSet(achievementSet: AchievementSet, achievements: CompletedAchievement[]): AchievementSet {
		const aggregatedAchievements: ReadonlyArray<Achievement> = achievementSet.achievements
			.map((ref: Achievement) => {
				let completedAchievement = achievements.filter(compl => compl.id == ref.id).pop();
				const numberOfCompletions = completedAchievement ? completedAchievement.numberOfCompletions : 0;
				return new Achievement(ref.id, ref.name, ref.type, ref.cardId, numberOfCompletions);
			});
		return new AchievementSet(achievementSet.id, achievementSet.displayName, aggregatedAchievements);
	}
}
