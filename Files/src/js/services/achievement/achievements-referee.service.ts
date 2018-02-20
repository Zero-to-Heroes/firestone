import { Injectable, EventEmitter } from '@angular/core';

// import * as Raven from 'raven-js';

import { Achievement } from '../../models/achievement';
import { Challenge } from './achievements/challenge';
import { AchievementsStorageService } from './achievements-storage.service';

@Injectable()
export class AchievementsRefereee {

	constructor(private achievementsStorage: AchievementsStorageService) {
	}

	public complete(challenge: Challenge, callback: Function, ...data: any[]) {
		let achievement = challenge.achieve();
		achievement.completed = true;
		this.achievementsStorage.checkAchievement(achievement, (alreadyCompleted) => {
			if (!alreadyCompleted) {
				this.achievementsStorage.claim(achievement, (result) => {
					callback(achievement);
				});
			}
		})

	}
}
