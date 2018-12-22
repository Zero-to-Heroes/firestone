import { Injectable, EventEmitter } from '@angular/core';

import { CompletedAchievement } from '../../models/completed-achievement';
import { Challenge } from './achievements/challenge';
import { AchievementsStorageService } from './achievements-storage.service';

@Injectable()
export class AchievementsRefereee {

	constructor(private achievementsStorage: AchievementsStorageService) {
	}

	public complete(challenge: Challenge, callback: Function, ...data: any[]) {
		console.log('complete challenge', challenge, data);
		this.achievementsStorage.loadAchievement(challenge.getAchievementId())
				.then((existingAchievement: CompletedAchievement) => {
						existingAchievement = existingAchievement || challenge.defaultAchievement();
						const completedAchievement: CompletedAchievement = new CompletedAchievement(
								existingAchievement.id, 
								existingAchievement.numberOfCompletions + 1,
								existingAchievement.replayInfo);
						this.achievementsStorage.saveAchievement(completedAchievement).then((result) => {
							// console.log('[achievements] achievement saved', result);
							callback(completedAchievement);
						});
					});
	}
}
