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

@Injectable()
export class AchievementsRepository {

	public modulesLoaded = new BehaviorSubject<boolean>(false);
	public challengeModules: Challenge[] = [];

	private allAchievements: Achievement[] = [];
	private setProviders: SetProvider[] = [];

	constructor(private storage: AchievementsStorageService, private cards: AllCardsService) {
		this.registerModules();
		this.modulesLoaded.next(true);
	}

	public getAllAchievements(): Achievement[] {
		return cloneDeep(this.allAchievements);
	}

	public loadAggregatedAchievements(): Promise<AchievementSet[]> {
		// console.log('loading aggregated achievements');
		return new Promise((resolve, reject) => {
			this.storage.loadAchievements((completedAchievements: CompletedAchievement[]) => {
				// console.log('loaded completed achievements', achievements);
				const achievementSets: AchievementSet[] = this.setProviders
						.map((provider) => provider.provide(this.allAchievements, completedAchievements));
				resolve(achievementSets);
			});
		});
	}

	public findCategoryForAchievement(achievementId: string): Promise<AchievementSet> {
		return new Promise((resolve, reject) => {
			this.loadAggregatedAchievements().then((sets: AchievementSet[]) => {
				console.log('loading aggregated achievements, processing', sets);
				const achievementSet: AchievementSet = sets.find((set) => {
					return set.achievements.filter((achievement) => achievement.id === achievementId).length > 0;
				});
				console.log('achievement', achievementId, 'matching set', achievementSet);
				resolve(achievementSet);
			});
		});
	}

	private registerModules() {
		// Create challenges
		this.achievementTypes().forEach((achievementType) => {
			this.createChallenge(achievementType.type, achievementType.challengeCreationFn);
		});
		// Initialize set providers
		this.setProviders = [
			new DungeonRunBossSetProvider(this.cards)
		];
		// Create all the achievements
		this.allAchievements = (<any>allAchievements)
			.map((achievement) => new Achievement(
				achievement.id, 
				achievement.name, 
				achievement.type, 
				achievement.bossId, 
				achievement.difficulty));
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
			{ type: 'dungeon_run_boss_encounter', challengeCreationFn: (achievement) => new BossEncounter(achievement) },
			{ type: 'dungeon_run_boss_victory', challengeCreationFn: (achievement) => new BossVictory(achievement) },
			{ type: 'monster_hunt_boss_encounter', challengeCreationFn: (achievement) => new BossEncounter(achievement) },
			{ type: 'monster_hunt_boss_victory', challengeCreationFn: (achievement) => new BossVictory(achievement) },
		];
	}
}