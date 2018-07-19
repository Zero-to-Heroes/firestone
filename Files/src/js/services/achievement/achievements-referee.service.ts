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
		this.achievementsStorage.loadAchievement(challenge.getAchievementId(), (existingAchievement: CompletedAchievement) => {
			let unclaimed = false;
			if (!existingAchievement) {
				unclaimed = true;
			}
			existingAchievement = existingAchievement || challenge.defaultAchievement();
			existingAchievement.numberOfCompletions++;
			this.achievementsStorage.saveAchievement(existingAchievement, (result) => {
				console.log('[achievements] achievement saved', result);
				callback(existingAchievement);
			});
		})

	}
}
