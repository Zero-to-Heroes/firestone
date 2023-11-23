import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { ApiRunner } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { RawAchievement } from '../../../models/achievement/raw-achievement';

const ACHIEVEMENTS_URL = 'https://static.zerotoheroes.com/hearthstone/data/achievements';

@Injectable()
export class RawAchievementsLoaderService {
	private rawAchievements$$ = new BehaviorSubject<readonly RawAchievement[]>([]);

	constructor(private readonly api: ApiRunner, private readonly prefs: PreferencesService) {}

	public async loadRawAchievements(): Promise<readonly RawAchievement[]> {
		if (this.rawAchievements$$.getValue().length > 0) {
			return this.rawAchievements$$.getValue();
		}

		console.log('[achievements-loader] Initializing achievements');
		console.debug('[achievements-loader] loading all achievements', new Error().stack);
		const rawAchievements: readonly RawAchievement[] = await this.loadAll();
		this.rawAchievements$$.next(rawAchievements);
		console.log('[achievements-loader] loaded all', rawAchievements.length);
		return rawAchievements;
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
}
