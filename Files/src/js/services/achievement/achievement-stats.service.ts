import { Injectable } from '@angular/core';

import { CompletedAchievement } from '../../models/completed-achievement';

import { Events } from '../events.service';
import { AchievementsRepository } from './achievements-repository.service';
import { Achievement } from '../../models/achievement';
import { HttpClient } from '@angular/common/http';

declare var overwolf: any;

@Injectable()
export class AchievementStatsService {

    private readonly ACHIEVEMENT_STATS_URL = 'https://d37acgsdwl.execute-api.us-west-2.amazonaws.com/Prod/achievementstats';

    private userId: string;
    private userMachineId: string;
    private username: string;

	constructor(
        private events: Events,
        private http: HttpClient,
		private repository: AchievementsRepository) {
        this.events.on(Events.NEW_ACHIEVEMENT).subscribe((event) => this.publishAchievementStats(event));
        this.retrieveUserInfo();
    }

    private retrieveUserInfo() {
        overwolf.profile.getCurrentUser((user) => {
            this.userId = user.userId;
            this.userMachineId = user.machineId;
            this.username = user.username;
        });
    }
    
    private publishAchievementStats(event, retriesLeft = 5) {
        if (retriesLeft <= 0) {
            console.error('Could not upload achievemnt stats after 5 retries');
            return;
        }
        const completedAchievement: CompletedAchievement = event.data[0];
        const achievement: Achievement = this.findAchievement(completedAchievement);
        const statEvent = {
            "creationDate": new Date(),
            "userId": this.userId,
            "userMachineId": this.userMachineId,
            "userName": this.username,
            "achievementId": achievement.id,
            "name": achievement.name,
            "type": achievement.type,
            "cardId": achievement.cardId,
            "numberOfCompletions": completedAchievement.numberOfCompletions + 1
        };
        // console.log('saving achievement to RDS', achievement, completedAchievement, statEvent);
        this.http.post(this.ACHIEVEMENT_STATS_URL, statEvent)
                .subscribe(
                    (result) => console.log('achievement stat event result', result),
                    (error) => {
                        console.warn('Could not upload achievemnt stats, retrying', error);
                        setTimeout(() => this.publishAchievementStats(event, retriesLeft--), 5000);
                    });
    }
    
    private findAchievement(completedchievement: CompletedAchievement): Achievement {
        return this.repository.getAllAchievements().filter(achievement => achievement.id == completedchievement.id)[0];
    }
}
