import { Injectable } from '@angular/core';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { Input } from '@firestone-hs/api-arena-rewards/dist/sqs-event';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { distinctUntilChanged, filter } from 'rxjs';
import { UserService } from '../user.service';

const REWARDS_RETRIEVE_URL = 'https://b763ob2h6h3ewimg7ztsl72p240qvfyr.lambda-url.us-west-2.on.aws/';

@Injectable()
export class ArenaRewardsService extends AbstractFacadeService<ArenaRewardsService> {
	public arenaRewards$$: SubscriberAwareBehaviorSubject<readonly ArenaRewardInfo[] | null>;

	private api: ApiRunner;
	private userService: UserService;

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
