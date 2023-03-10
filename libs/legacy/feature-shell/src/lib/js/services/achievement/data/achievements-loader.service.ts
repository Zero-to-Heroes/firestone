import { Injectable } from '@angular/core';
import { ApiRunner } from '@firestone/shared/framework/core';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { Achievement } from '../../../models/achievement';
import { RawAchievement } from '../../../models/achievement/raw-achievement';
import { Challenge } from '../achievements/challenges/challenge';
import { ChallengeBuilderService } from '../achievements/challenges/challenge-builder.service';

const ACHIEVEMENTS_URL = 'https://static.zerotoheroes.com/hearthstone/data/achievements';

@Injectable()
export class AchievementsLoaderService {
	public challengeModules: readonly Challenge[];

	private achievements: readonly Achievement[] = [];

	constructor(
		private readonly api: ApiRunner,
		private readonly challengeBuilder: ChallengeBuilderService,
		private readonly prefs: PreferencesService,
	) {}

	public async getAchievement(achievementId: string): Promise<Achievement> {
		await this.waitForInit();
		return this.achievements.find((achievement) => achievement.id === achievementId);
	}

	public async getAchievementsById(achievementIds: readonly string[]): Promise<readonly Achievement[]> {
		if (!achievementIds) {
			return [];
		}
		await this.waitForInit();
		return this.achievements.filter((achievement) => achievementIds.indexOf(achievement.id) !== -1);
	}

	public async getAchievements(): Promise<readonly Achievement[]> {
		await this.waitForInit();
		return this.achievements;
	}

	public async getChallengeModules(): Promise<readonly Challenge[]> {
		await this.waitForInit();
		return this.challengeModules;
	}

	public async initializeAchievements(): Promise<[readonly Achievement[], readonly Challenge[]]> {
		console.log('[achievements-loader] Initializing achievements');
		const rawAchievements: readonly RawAchievement[] = await this.loadAll();
		console.log('[achievements-loader] loaded all', rawAchievements.length);
		return new Promise<[readonly Achievement[], readonly Challenge[]]>((resolve) => {
			this.achievements = rawAchievements
				.filter((raw) => raw)
				.map((rawAchievement) => this.wrapRawAchievement(rawAchievement));
			this.challengeModules = rawAchievements
				.map((rawAchievement) => this.challengeBuilder.buildChallenge(rawAchievement))
				.filter((challenge) => challenge);
			console.log('[achievements-loader] init over', this.achievements.length, this.challengeModules.length);
			resolve([this.achievements, this.challengeModules]);
		});
	}

	private async loadAll(): Promise<readonly RawAchievement[]> {
		console.log('[achievements-loader] loading all achievements');
		const prefs = await this.prefs.getPreferences();
		const achievementFiles = [
			`hearthstone_game_${prefs.locale}`,
			'global',
			'battlegrounds2',
			'dungeon_run',
			'monster_hunt',
			'rumble_run',
			'dalaran_heist',
			'tombs_of_terror',
			'amazing_plays',
			'competitive_ladder',
			'deckbuilding',
			'galakrond',
			'thijs',
		];
		const achievementsFromRemote = await Promise.all(
			achievementFiles.map((fileName) => this.loadAchievements(fileName)),
		);
		const result = achievementsFromRemote.reduce((a, b) => a.concat(b), []);
		console.log('[achievements-loader] returning full achievements', result && result.length);
		return result;
	}

	private async loadAchievements(fileName: string): Promise<readonly RawAchievement[]> {
		return this.api.callGetApi(`${ACHIEVEMENTS_URL}/${fileName}.json`);
	}

	private wrapRawAchievement(raw: RawAchievement): Achievement {
		const { requirements, resetEvents, ...achievement } = raw;
		return Object.assign(new Achievement(), achievement, {
			numberOfCompletions: 0,
		} as Achievement);
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.achievements && this.challengeModules) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
