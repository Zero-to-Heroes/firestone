import { Injectable } from '@angular/core';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { Input } from '@firestone-hs/api-arena-rewards/dist/sqs-event';
import { ArenaInfo, MemoryUpdatesService, Reward } from '@firestone/memory';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { distinctUntilChanged, filter, withLatestFrom } from 'rxjs';
import { ReviewIdService } from '../review-id.service';
import { UserService } from '../user.service';
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
	private reviewIdService: ReviewIdService;
	private ow: OverwolfService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'arenaRewards', () => !!this.arenaRewards$$);
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
		this.reviewIdService = AppInjector.get(ReviewIdService);
		this.ow = AppInjector.get(OverwolfService);

		this.arenaRewards$$.onFirstSubscribe(async () => {
			this.userService.user$$
				.pipe(
					distinctUntilChanged(),
					filter((user) => !!user),
				)
				.subscribe(async (currentUser) => {
					console.log('[arena-rewards] getting rewards for user', currentUser.userId, currentUser.username);
					const result: readonly ArenaRewardInfo[] = await this.api.callPostApi(REWARDS_RETRIEVE_URL, {
						userId: currentUser.userId,
						userName: currentUser.username,
					});
					this.arenaRewards$$.next(result);
				});
		});

		this.memoryUpdates.memoryUpdates$$
			.pipe(
				filter((changes) => !!changes.ArenaRewards?.length),
				withLatestFrom(this.arenaInfoService.arenaInfo$$, this.reviewIdService.reviewId$),
				filter(([changes, arenaInfo, reviewId]) => !!arenaInfo?.runId),
			)
			.subscribe(([changes, arenaInfo, reviewId]) => {
				this.handleRewards(changes.ArenaRewards, arenaInfo, reviewId);
			});
	}

	public async addRewards(rewards: Input) {
		const currentRewards = await this.arenaRewards$$.getValueWithInit();
		if (currentRewards?.some((reward) => reward.runId === rewards.runId)) {
			console.log('[arena-rewards] rewards have already been added', rewards.runId);
			return;
		}

		const newRewards: readonly ArenaRewardInfo[] = [...(currentRewards ?? []), ...this.buildRewards(rewards)];
		this.arenaRewards$$.next(newRewards);
	}

	private async handleRewards(rewards: readonly Reward[], arenaInfo: ArenaInfo, reviewId: string) {
		const user = await this.ow.getCurrentUser();
		const rewardsInput: Input = {
			userId: user.userId,
			userName: user.username,
			type: 'arena',
			reviewId: reviewId,
			runId: arenaInfo.runId,
			rewards: rewards,
			currentWins: arenaInfo.wins,
			currentLosses: arenaInfo.losses,
			appVersion: process.env.APP_VERSION,
		};
		console.log('[arena-rewards] sending rewards info', rewardsInput);
		this.addRewards(rewardsInput);
		this.api.callPostApi(UPDATE_URL, rewardsInput);
	}

	private buildRewards(input: Input): readonly ArenaRewardInfo[] {
		if (!input?.rewards?.length) {
			return [];
		}

		return input.rewards.map(
			(reward) =>
				({
					creationDate: new Date().toDateString(),
					losses: input.currentLosses,
					reviewId: input.reviewId,
					runId: input.runId,
					userId: input.userId,
					userName: input.userName,
					wins: input.currentWins,
					rewardAmount: reward.Amount,
					rewardBoosterId: reward.BoosterId,
					rewardType: reward.Type,
				} as ArenaRewardInfo),
		);
	}
}
