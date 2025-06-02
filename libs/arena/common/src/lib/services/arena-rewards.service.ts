/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { Input } from '@firestone-hs/api-arena-rewards/dist/sqs-event';
import { formatGameType } from '@firestone-hs/reference-data';
import { ArenaInfo, MemoryUpdatesService, Reward } from '@firestone/memory';
import { DiskCacheService } from '@firestone/shared/common/service';
import { groupByFunction2, SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	ARENA_REWARDS,
	IndexedDbService,
	OverwolfService,
	UserService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { distinctUntilChanged, filter } from 'rxjs';
import { ArenaInfoService } from './arena-info.service';

const REWARDS_RETRIEVE_URL = 'https://b763ob2h6h3ewimg7ztsl72p240qvfyr.lambda-url.us-west-2.on.aws/';
const UPDATE_URL = 'https://5ko26odaiczaspuvispnw3iv3e0kthll.lambda-url.us-west-2.on.aws/';

@Injectable()
export class ArenaRewardsService extends AbstractFacadeService<ArenaRewardsService> {
	public arenaRewards$$: SubscriberAwareBehaviorSubject<readonly ArenaRewardInfo[] | null>;

	private api: ApiRunner;
	private userService: UserService;
	private memoryUpdates: MemoryUpdatesService;
	private arenaInfoService: ArenaInfoService;
	private ow: OverwolfService;
	private diskCache: DiskCacheService;
	private indexedDb: IndexedDbService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaRewardsService', () => !!this.arenaRewards$$);
	}

	protected override assignSubjects() {
		this.arenaRewards$$ = this.mainInstance.arenaRewards$$;
	}

	protected async init() {
		this.arenaRewards$$ = new SubscriberAwareBehaviorSubject<readonly ArenaRewardInfo[] | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.userService = AppInjector.get(UserService);
		this.memoryUpdates = AppInjector.get(MemoryUpdatesService);
		this.arenaInfoService = AppInjector.get(ArenaInfoService);
		this.indexedDb = AppInjector.get(IndexedDbService);
		this.ow = AppInjector.get(OverwolfService);
		this.diskCache = AppInjector.get(DiskCacheService);

		this.arenaRewards$$.onFirstSubscribe(async () => {
			this.userService.user$$
				.pipe(
					distinctUntilChanged(),
					filter((user) => !!user),
				)
				.subscribe(async (currentUser) => {
					console.log('[arena-rewards] getting rewards for user', currentUser?.userId, currentUser?.username);
					const result: readonly ArenaRewardInfo[] | null = await this.loadArenaRewards(currentUser);
					this.arenaRewards$$.next(result);
				});
		});

		this.memoryUpdates.memoryUpdates$$
			.pipe(filter((changes) => !!changes?.ArenaRewards?.length))
			.subscribe(async (changes) => {
				const arenaInfo = await this.arenaInfoService.forceRetrieveArenaInfo();
				console.log('[arena-rewards] received memory update', changes, arenaInfo);
				if (!arenaInfo?.runId) {
					return;
				}
				this.handleRewards(changes.ArenaRewards, arenaInfo);
			});
	}

	public async addRewards(rewards: Input) {
		return this.mainInstance.addRewardsInternal(rewards);
	}
	private async addRewardsInternal(rewards: Input) {
		const currentRewards = await this.arenaRewards$$.getValueWithInit();
		if (currentRewards?.some((reward) => reward.runId === rewards.runId)) {
			console.log('[arena-rewards] rewards have already been added', rewards.runId);
			return;
		}

		const newRewards: readonly ArenaRewardInfo[] = [...(currentRewards ?? []), ...this.buildRewards(rewards)];
		this.arenaRewards$$.next(newRewards);
		await this.indexedDb.table<ArenaRewardInfo, string>(ARENA_REWARDS).bulkPut(newRewards);
	}

	private async loadArenaRewards(
		currentUser: overwolf.profile.GetCurrentUserResult | null,
	): Promise<readonly ArenaRewardInfo[] | null> {
		const localRewards = await this.indexedDb.table<ArenaRewardInfo, string>(ARENA_REWARDS).toArray();
		if (!!localRewards?.length) {
			console.log('[arena-rewards] returning rewards from indexedDb', localRewards.length);
			return localRewards;
		}

		const rewardsFromDisk = await this.diskCache.getItem<readonly ArenaRewardInfo[]>(
			DiskCacheService.DISK_CACHE_KEYS.ARENA_REWARDS,
		);
		if (!!rewardsFromDisk?.length) {
			this.indexedDb.table<ArenaRewardInfo, string>(ARENA_REWARDS).bulkPut(rewardsFromDisk);
			return rewardsFromDisk;
		}

		console.log('[arena-rewards] fetching rewards from remote');
		const remoteRewards = await this.api.callPostApi<readonly ArenaRewardInfo[]>(REWARDS_RETRIEVE_URL, {
			userId: currentUser?.userId,
			userName: currentUser?.username,
		});
		const result = remoteRewards ?? [];
		this.indexedDb.table<ArenaRewardInfo, string>(ARENA_REWARDS).bulkPut(result);
		return result;
	}

	private async handleRewards(rewards: readonly Reward[], arenaInfo: ArenaInfo) {
		const user = await this.ow.getCurrentUser();
		const groupedByType = groupByFunction2(rewards, (r) => r.Type);
		const groupedRewards: readonly Reward[] = Object.values(groupedByType).map((rewards) =>
			rewards.reduce((a, b) => ({ ...a, Amount: a.Amount + b.Amount })),
		);
		const rewardsInput: Input = {
			userId: user.userId ?? '',
			userName: user.username ?? '',
			type: formatGameType(arenaInfo.gameType) as 'arena' | 'arena-underground',
			runId: arenaInfo.runId,
			rewards: groupedRewards,
			currentWins: arenaInfo.wins,
			currentLosses: arenaInfo.losses,
			appVersion: process.env['APP_VERSION'] ?? '0.0.0',
		};
		console.log('[arena-rewards] sending rewards info', rewardsInput);
		this.addRewards(rewardsInput);
		this.api.callPostApi(UPDATE_URL, rewardsInput);
	}

	private buildRewards(input: Input): readonly ArenaRewardInfo[] {
		if (!input?.rewards?.length) {
			return [];
		}

		const groupedByType = groupByFunction2(input.rewards, (r) => r.Type);
		const groupedRewards: readonly Reward[] = Object.values(groupedByType).map((rewards) =>
			rewards.reduce((a, b) => ({ ...a, Amount: a.Amount + b.Amount })),
		);
		return groupedRewards.map((reward) => ({
			creationDate: new Date().toISOString(),
			losses: input.currentLosses,
			runId: input.runId,
			userId: input.userId,
			userName: input.userName,
			wins: input.currentWins,
			rewardAmount: reward.Amount,
			rewardBoosterId: reward.BoosterId,
			rewardType: reward.Type,
		}));
	}
}
