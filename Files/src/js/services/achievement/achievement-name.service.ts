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
        return this.nameForType(type) + name;
    }

    private nameForType(type: string) {
        switch(type) {
            case 'dungeon_run_boss_encounter': return 'Boss met: ';
            case 'dungeon_run_boss_victory': return 'Boss defeated: ';
            case 'dungeon_run_treasure_play': 
            case 'monster_hunt_treasure_play': 
            case 'dalaran_heist_treasure_play': 
                return 'Treasure played: ';
            case 'dungeon_run_passive_play': 
            case 'monster_hunt_passive_play': 
            case 'dalaran_heist_passive_play': 
                return 'Passive triggered: ';
            case 'monster_hunt_boss_encounter': return 'Monster met: ';
            case 'monster_hunt_boss_victory': return 'Monster defeated: ';
            case 'rumble_run_shrine_play': return 'Shrine played: ';
            case 'rumble_run_teammate_play': return 'Teammate joined: ';
            case 'rumble_run_passive_play': return 'Passive ability triggered: ';
            case 'rumble_run_progression': 
            case 'dungeon_run_progression': 
            case 'monster_hunt_progression':             
                return '';
        }
        return '';
    }
}
