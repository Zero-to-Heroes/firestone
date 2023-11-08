import { Injectable } from '@angular/core';
import { DuelsLeaderboard } from '@firestone-hs/duels-leaderboard';
import { Input } from '@firestone-hs/retrieve-users-duels-runs/dist/input';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { ApiRunner } from '@firestone/shared/framework/core';
import { UserService } from '../user.service';

const DUELS_LEADERBOARD_URL = 'https://hj7zgbe3esjkltgsbu3pznjq4q0edrhn.lambda-url.us-west-2.on.aws/';

@Injectable()
export class DuelsLeaderboardService {
	public duelsLeaderboard$$ = new SubscriberAwareBehaviorSubject<DuelsLeaderboard>(null);

	constructor(private readonly api: ApiRunner, private readonly userService: UserService) {
		window['duelsLeaderboard'] = this;
		this.init();
	}

	private async init(): Promise<void> {
		this.duelsLeaderboard$$.onFirstSubscribe(async () => {
			const user = await this.userService.getCurrentUser();
			const input: Input = {
				userId: user.userId,
				userName: user.username,
			};
			const results: any = await this.api.callPostApi(DUELS_LEADERBOARD_URL, input);
			console.log('[duels-leaderboard] loaded leaderboard', results?.results?.heroic?.length);
			console.debug('[duels-leaderboard] loaded leaderboard', results);
			this.duelsLeaderboard$$.next(results?.results);
		});
	}
}
