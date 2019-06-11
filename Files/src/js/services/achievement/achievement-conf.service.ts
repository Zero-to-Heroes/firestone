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
        const recordOnlyOnce = [
            'dungeon_run_boss_encounter', 
            'dungeon_run_treasure_play', 
            'dungeon_run_passive_play', 
            'monster_hunt_boss_encounter', 
            'monster_hunt_treasure_play', 
            'monster_hunt_passive_play', 
            'rumble_run_shrine_play',
            'rumble_run_teammate_play',
            'rumble_run_passive_play',
            'dalaran_heist_treasure_play', 
            'dalaran_heist_passive_play', 
        ];
        // Only record free achievements once
        if (recordOnlyOnce.indexOf(achievement.type) !== -1 || achievement.difficulty === 'free') {
            const result = !completedAchievement.replayInfo || completedAchievement.replayInfo.length === 0;
            console.log('[recording] should record?', achievement.type, result, completedAchievement.replayInfo);
            return result;
        }
        console.log('[recording] should record?', achievement.type, true, completedAchievement.replayInfo);
        return true;
    }

    public icon(achievementType: string) {
        if (['dungeon_run_boss_encounter', 
                'monster_hunt_boss_encounter',
                'dalaran_heist_boss_encounter', 
                'dalaran_heist_boss_encounter_heroic'].indexOf(achievementType) !== -1) {
            return 'boss_encounter';
        }
        if (['dungeon_run_boss_victory', 
                'monster_hunt_boss_victory',
                'dalaran_heist_boss_victory',
                'dalaran_heist_boss_victory_heroic'].indexOf(achievementType) !== -1) {
            return 'boss_victory';
        }
        // console.warn('missing icon for achievement', achievementType);
        return 'boss_victory';
    }
}
