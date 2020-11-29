import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Achievement } from '../../models/achievement';
import { AchievementCategory } from '../../models/achievement-category';
import { AchievementSet } from '../../models/achievement-set';
import { CompletedAchievement } from '../../models/completed-achievement';
import { AchievementCategoryProvider } from './achievement-sets/achievement-category-provider';
import { AmazingPlaysCategoryProvider } from './achievement-sets/amazing-plays/amazing-plays-category';
import { BattlegroundsCategoryProvider } from './achievement-sets/battlegrounds/battlegrounds-category';
import { CompetitiveLadderCategoryProvider } from './achievement-sets/competitive-ladder/competitive-ladder-category';
import { DalaranHeistCategoryProvider } from './achievement-sets/dalaran_heist/dalaran-heist-category';
import { DeckbuildingCategoryProvider } from './achievement-sets/deckbuilding/deckbuilding-category';
import { DungeonRunCategoryProvider } from './achievement-sets/dungeon-run/dungeon-run-category';
import { GalakrondCategoryProvider } from './achievement-sets/galadrond-awakening/galakrond-category';
import { GlobalCategoryProvider } from './achievement-sets/global/global-category';
import { MonsterHuntCategoryProvider } from './achievement-sets/monster_hunt/monster-hunt-category';
import { RumbleRunCategoryProvider } from './achievement-sets/rumble_run/rumble-run-category';
import { SetProvider } from './achievement-sets/set-provider';
import { ThijsCategoryProvider } from './achievement-sets/thijs/thijs-category';
import { TombsOfTerrorCategoryProvider } from './achievement-sets/tombs_of_terror/tombs-of-terror-category';
import { AchievementsLocalStorageService } from './achievements-local-storage.service';
import { AchievementsLoaderService } from './data/achievements-loader.service';
import { RemoteAchievementsService } from './remote-achievements.service';

@Injectable()
export class AchievementsRepository {
	public modulesLoaded = new BehaviorSubject<boolean>(false);

	private setProviders: readonly SetProvider[];
	private categories: readonly AchievementCategory[];

	constructor(
		private storage: AchievementsLocalStorageService,
		private remoteAchievements: RemoteAchievementsService,
		private achievementsLoader: AchievementsLoaderService,
	) {
		this.init();
	}

	public async loadAggregatedAchievements(useCache = false): Promise<AchievementSet[]> {
		// console.log('[perf] getting reference data');
		const [allAchievements, completedAchievements, replayInfos] = await Promise.all([
			this.achievementsLoader.getAchievements(),
			useCache ? this.storage.loadAchievementsFromCache() : this.remoteAchievements.loadAchievements(),
			this.storage.loadAllReplayInfos(),
		]);
		// console.log('[perf] merging replay infos');
		const achievementsWithReplayInfos = this.mergeReplayInfos(
			allAchievements as readonly Achievement[], // Not sure why this is needed?
			replayInfos,
		);
		// console.log('[perf] mapping set providers');
		const result = await this.gradualLoadProviders(
			achievementsWithReplayInfos,
			completedAchievements as CompletedAchievement[],
		);
		// console.log('[perf] finished mapping set providers, returning result', result);
		return result;
	}

	private async gradualLoadProviders(
		achievementsWithReplayInfos: readonly Achievement[],
		completedAchievements: CompletedAchievement[],
	) {
		const it = this.doGradualLoad(achievementsWithReplayInfos, completedAchievements);
		return new Promise<AchievementSet[]>(resolve => {
			this.gradualLoad(it, providers => {
				resolve(providers);
			});
		});
	}

	private gradualLoad(it: IterableIterator<void>, callback) {
		const itValue = it.next();
		if (!itValue.done) {
			setTimeout(() => this.gradualLoad(it, callback), 50);
		} else {
			callback(itValue.value);
		}
	}

	private *doGradualLoad(
		achievementsWithReplayInfos: readonly Achievement[],
		completedAchievements: CompletedAchievement[],
	): IterableIterator<void> {
		// console.log('starting loading achievements');
		const providers = [];
		for (const provider of this.setProviders) {
			providers.push(
				provider.provide(achievementsWithReplayInfos, completedAchievements as CompletedAchievement[]),
			);
			yield;
		}
		return providers;
	}

	private mergeReplayInfos(
		allAchievements: readonly Achievement[],
		replayInfos: readonly CompletedAchievement[],
	): readonly Achievement[] {
		return allAchievements.map(ach => {
			const replays = replayInfos.find(info => info.id === ach.id);
			// if (replays) {
			// 	console.log('will return ', ach.update({ replayInfo: replays.replayInfo } as Achievement));
			// }
			return replays ? ach.update({ replayInfo: replays.replayInfo } as Achievement) : ach;
		});
	}

	public async getCategories(): Promise<readonly AchievementCategory[]> {
		await this.waitForInit();
		return this.categories;
	}

	private async init() {
		await this.achievementsLoader.initializeAchievements();
		this.buildCategories();
		console.log('[achievements-repository] achievements initialised');
		this.modulesLoaded.next(true);
	}

	private buildCategories() {
		const categoryProviders: readonly AchievementCategoryProvider[] = [
			new GlobalCategoryProvider(),
			new CompetitiveLadderCategoryProvider(),
			new AmazingPlaysCategoryProvider(),
			new DeckbuildingCategoryProvider(),
			new ThijsCategoryProvider(),
			new BattlegroundsCategoryProvider(),
			new GalakrondCategoryProvider(),
			new TombsOfTerrorCategoryProvider(),
			new DalaranHeistCategoryProvider(),
			new RumbleRunCategoryProvider(),
			new MonsterHuntCategoryProvider(),
			new DungeonRunCategoryProvider(),
		];

		this.categories = categoryProviders.map(provider => provider.buildCategory());
		this.setProviders = categoryProviders.map(provider => provider.setProviders).reduce((a, b) => a.concat(b));
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>(resolve => {
			const dbWait = () => {
				if (this.setProviders) {
					resolve();
				} else {
					// console.log('[achievement-repository] waiting for DB init');
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
