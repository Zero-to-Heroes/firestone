import { Injectable } from '@angular/core';
import { Achievement } from '../../models/achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { AchievementsStorageService } from './achievements-storage.service';

@Injectable()
export class AchievementConfService {

    constructor(private achievementStorage: AchievementsStorageService) {

    }

    public async shouldRecord(achievement: Achievement): Promise<boolean> {
        const completedAchievement: CompletedAchievement = await this.achievementStorage.loadAchievement(achievement.id);
        // Only record the first time for an encounter
        if (['dungeon_run_boss_encounter', 'monster_hunt_boss_encounter', 'rumble_run_shrine_play'].indexOf(achievement.type) !== -1) {
            const result = !completedAchievement.replayInfo || completedAchievement.replayInfo.length === 0;
            console.log('[recording] should record?', achievement.type, result, completedAchievement.replayInfo);
            return result;
        }
        else if (['dungeon_run_boss_victory', 'monster_hunt_boss_victory'].indexOf(achievement.type) !== -1) {
            if (achievement.difficulty === 'free') {
                const result = !completedAchievement.replayInfo || completedAchievement.replayInfo.length < 2;
                console.log('[recording] should record?', achievement.type, result, completedAchievement.replayInfo);
                return result;
            }
        }
        console.log('[recording] should record?', achievement.type, true, completedAchievement.replayInfo);
        return true;
    }

    public icon(achievementType: string) {
        if (['dungeon_run_boss_encounter', 'monster_hunt_boss_encounter'].indexOf(achievementType) !== -1) {
            return 'boss_encounter';
        }
        if (['dungeon_run_boss_victory', 'monster_hunt_boss_victory'].indexOf(achievementType) !== -1) {
            return 'boss_victory';
        }
        return 'missing_icon';
    }
}
