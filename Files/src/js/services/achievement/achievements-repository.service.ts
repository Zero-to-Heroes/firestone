import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { cloneDeep } from 'lodash'

import { default as allAchievements } from './achievements_list.json';

import { CompletedAchievement } from '../../models/completed-achievement';
import { Achievement } from '../../models/achievement';
import { AchievementSet } from '../../models/achievement-set';

import { Challenge } from './achievements/challenge';
import { BossEncounter } from './achievements/boss-encounter';
import { BossVictory } from './achievements/boss-victory';
import { DungeonRunBossSetProvider } from './achievement-sets/dungeon-run-boss';
import { AchievementsStorageService } from './achievements-storage.service';
import { SetProvider } from './achievement-sets/set-provider';
import { AllCardsService } from '../all-cards.service';
import { MonsterHuntBossSetProvider } from './achievement-sets/monster-hunt-boss.js';
import { Events } from '../events.service.js';

@Injectable()
export class AchievementsRepository {

	public modulesLoaded = new BehaviorSubject<boolean>(false);
	public challengeModules: Challenge[] = [];

	private allAchievements: Achievement[] = [];
	private setProviders: SetProvider[] = [];

	constructor(private storage: AchievementsStorageService, private cards: AllCardsService, private events: Events) {
		this.registerModules();
		this.modulesLoaded.next(true);
	}

	public getAllAchievements(): Achievement[] {
		return cloneDeep(this.allAchievements);
	}

	public async loadAggregatedAchievements(): Promise<AchievementSet[]> {
		const completedAchievements: CompletedAchievement[] = await this.storage.loadAchievements();
		const achievementSets: AchievementSet[] = this.setProviders
				.map((provider) => provider.provide(this.allAchievements, completedAchievements));
		return achievementSets;
	}

	public async findCategoryForAchievement(achievementId: string): Promise<AchievementSet> {
		const completedAchievements: CompletedAchievement[] = await this.storage.loadAchievements();
		const achievementSet: AchievementSet = this.setProviders
				.find((provider) => provider.supportsAchievement(this.allAchievements, achievementId))
				.provide(this.allAchievements, completedAchievements);
		console.log('achievement', achievementId, 'matching set', achievementSet);
		return achievementSet;
	}

	private registerModules() {
		// Create challenges
		this.achievementTypes().forEach((achievementType) => {
			this.createChallenge(achievementType.type, achievementType.challengeCreationFn);
		});
		// Initialize set providers
		this.setProviders = [
			new DungeonRunBossSetProvider(this.cards),
			new MonsterHuntBossSetProvider(this.cards),
		];
		// Create all the achievements
		this.allAchievements = (<any>allAchievements)
			.map((achievement) => new Achievement(
				achievement.id, 
				achievement.name, 
				achievement.type, 
				achievement.bossId, 
				achievement.difficulty,
				0,
				[]));
		// Create the achievement sets
		this.loadAggregatedAchievements().then((result) => console.log('loaded aggregated achievements', result));
		console.log('[achievements] modules registered', this.challengeModules);
	}

	private createChallenge(achievementType: string, challengeCreationFn: Function) {
		(<any>allAchievements)
			.filter((achievement) => achievement.type === achievementType)
			.map(achievement => challengeCreationFn(achievement))
			.map((challenge) => {
				this.challengeModules.push(challenge);
			});
	}

	private achievementTypes() {
		return [
			{ type: 'dungeon_run_boss_encounter', challengeCreationFn: (achievement) => new BossEncounter(achievement, this.events) },
			{ type: 'dungeon_run_boss_victory', challengeCreationFn: (achievement) => new BossVictory(achievement, this.events) },
			{ type: 'monster_hunt_boss_encounter', challengeCreationFn: (achievement) => new BossEncounter(achievement, this.events) },
			{ type: 'monster_hunt_boss_victory', challengeCreationFn: (achievement) => new BossVictory(achievement, this.events) },
		];
	}
}