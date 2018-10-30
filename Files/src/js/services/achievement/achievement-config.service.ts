import { Injectable } from '@angular/core';

@Injectable()
export class AchievementConfigService {

    public getConfig(achievementType: string): AchievementConfig {
        switch(achievementType) {
            case 'dungeon_run_boss_encounter':
            case 'monster_hunt_boss_encounter':
                // We know the opponent some time before the UI actually shows it, so we don't need buffer before
                return { timeToRecordBeforeInMillis: 500, timeToRecordAfterInMillis: 12000 };
            case 'dungeon_run_boss_victory':
            case 'monster_hunt_boss_victory':
                return { timeToRecordBeforeInMillis: 20000, timeToRecordAfterInMillis: 15000 };
        }
    }
}

export class AchievementConfig {
    readonly timeToRecordBeforeInMillis;
    readonly timeToRecordAfterInMillis;
}
