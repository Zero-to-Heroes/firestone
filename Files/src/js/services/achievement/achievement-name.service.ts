import { Injectable } from '@angular/core';
import { AchievementsRepository } from './achievements-repository.service';

@Injectable()
export class AchievementNameService {

    constructor(private repo: AchievementsRepository) {

    }

    public displayName(achievementId: string) {
        return this.repo.getAllAchievements()
            .filter((achievement) => achievement.id === achievementId)
            .map((achievement) => this.buildName(achievement.type, achievement.name))
            [0];
    }

    private buildName(type: string, name: string) {
        return this.nameForType(type) + ': ' + name;
    }

    private nameForType(type: string) {
        switch(type) {
            case 'dungeon_run_boss_encounter': return 'Boss met';
            case 'dungeon_run_boss_victory': return 'Boss defeated';
            case 'monster_hunt_boss_encounter': return 'Monster met';
            case 'monster_hunt_boss_victory': return 'Monster defeated';
            case 'rumble_run_shrine_play': return 'Shrine played';
            case 'rumble_run_teammate_play': return 'Teammate joined';
            case 'rumble_run_passive_play': return 'Passive ability triggered';
            case 'rumble_run_progression': return 'Round cleared';
        }
        return 'unknown';
    }
}
