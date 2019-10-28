import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Achievement } from '../../../models/achievement';
import { RawAchievement } from '../../../models/achievement/raw-achievement';
import { ReplayInfo } from '../../../models/replay-info';
import { Challenge } from '../achievements/challenges/challenge';
import { ChallengeBuilderService } from '../achievements/challenges/challenge-builder.service';
// import amazingPlays from './amazing_plays.json';
// import competitiveLadder from './competitive_ladder.json';
// import dalaranHeist from './dalaran_heist.json';
// import deckbuilding from './deckbuilding.json';
// import dungeonRun from './dungeon_run.json';
// import monsterHunt from './monster_hunt.json';
// import rumbleRun from './rumble_run.json';
// import tombsOfTerror from './tombs_of_terror.json';

@Injectable()
export class AchievementsLoaderService {
	public challengeModules: readonly Challenge[];

	private achievements: readonly Achievement[];

	constructor(private http: HttpClient, private challengeBuilder: ChallengeBuilderService) {}

	public async getAchievement(achievementId): Promise<Achievement> {
		await this.waitForInit();
		return this.achievements.find(achievement => achievement.id === achievementId);
	}

	public async getAchievements(): Promise<readonly Achievement[]> {
		console.log('[achievements-loader] Getting achievements');
		await this.waitForInit();
		return this.achievements;
	}

	public async getChallengeModules(): Promise<readonly Challenge[]> {
		console.log('[achievements-loader] Getting modules');
		await this.waitForInit();
		return this.challengeModules;
	}

	public async initializeAchievements(
		inputAchievements?: readonly RawAchievement[],
	): Promise<[readonly Achievement[], readonly Challenge[]]> {
		console.log('[achievements-loader] Initializing achievements', inputAchievements && inputAchievements.length);
		const rawAchievements: readonly RawAchievement[] = inputAchievements || (await this.loadAll());
		console.log('[achievements-loader] loaded all', rawAchievements.length);
		return new Promise<[readonly Achievement[], readonly Challenge[]]>(resolve => {
			this.achievements = rawAchievements.map(rawAchievement => this.wrapRawAchievement(rawAchievement));
			this.challengeModules = rawAchievements.map(rawAchievement =>
				this.challengeBuilder.buildChallenge(rawAchievement),
			);
			console.log('[achievements-loader] init over', this.achievements.length, this.challengeModules.length);
			resolve([this.achievements, this.challengeModules]);
		});
	}

	private async loadAll(): Promise<readonly RawAchievement[]> {
		console.log('[achievements-loader] loading all achievements');
		const [
			dungeonRun,
			monsterHunt,
			rumbleRun,
			dalaranHeist,
			tombsOfTerror,
			amazingPlays,
			competitiveLadder,
			deckbuilding,
		] = await Promise.all([
			this.loadSet('dungeon_run.json'),
			this.loadSet('monster_hunt.json'),
			this.loadSet('rumble_run.json'),
			this.loadSet('dalaran_heist.json'),
			this.loadSet('tombs_of_terror.json'),
			this.loadSet('amazing_plays.json'),
			this.loadSet('competitive_ladder.json'),
			this.loadSet('deckbuilding.json'),
		]);
		return [
			...dungeonRun,
			...monsterHunt,
			...rumbleRun,
			...dalaranHeist,
			...tombsOfTerror,
			...amazingPlays,
			...competitiveLadder,
			...deckbuilding,
		];
	}

	private async loadSet(fileName: string): Promise<readonly RawAchievement[]> {
		return new Promise<readonly RawAchievement[]>((resolve, reject) => {
			this.http.get(`./achievements/${fileName}`).subscribe(
				(result: RawAchievement[]) => {
					resolve(result);
				},
				error => {
					console.error('[achievements-loader] could not load achievement set', fileName, error);
					reject();
				},
			);
		});
	}

	private wrapRawAchievement(raw: RawAchievement): Achievement {
		const { requirements, resetEvents, ...achievement } = raw;
		return Object.assign(new Achievement(), achievement, {
			numberOfCompletions: 0,
			replayInfo: [] as readonly ReplayInfo[],
		} as Achievement);
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>(resolve => {
			const dbWait = () => {
				if (this.achievements && this.challengeModules) {
					resolve();
				} else {
					// console.log('[achievements-loader] waiting for init');
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
