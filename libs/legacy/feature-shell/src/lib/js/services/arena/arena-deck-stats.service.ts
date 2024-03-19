import { Injectable } from '@angular/core';
import { DraftDeckStats } from '@firestone-hs/arena-draft-pick';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	UserService,
	WindowManagerService,
} from '@firestone/shared/framework/core';

const SAVE_URL = `https://kfudiyqjqqra5cvjbt543ippfe0xzbjv.lambda-url.us-west-2.on.aws/`;
const RETRIEVE_URL = 'https://oqskvzs6pjzhrcsg54z7tvnxoe0fmuyw.lambda-url.us-west-2.on.aws/';

@Injectable()
export class ArenaDeckStatsService extends AbstractFacadeService<ArenaDeckStatsService> {
	public deckStats$$: SubscriberAwareBehaviorSubject<readonly DraftDeckStats[] | null>;

	private api: ApiRunner;
	private user: UserService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaDeckStatsService', () => !!this.deckStats$$);
	}

	protected override assignSubjects() {
		this.deckStats$$ = this.mainInstance.deckStats$$;
	}

	protected async init() {
		this.deckStats$$ = new SubscriberAwareBehaviorSubject<readonly DraftDeckStats[] | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.user = AppInjector.get(UserService);

		this.deckStats$$.onFirstSubscribe(async () => {
			const currentUser = await this.user.getCurrentUser();
			const existingStats: readonly DraftDeckStats[] = await this.api.callPostApi(RETRIEVE_URL, {
				userId: currentUser.userId,
				userName: currentUser.username,
			});
			console.debug('[arena-deck-stats] retrieved deck stats', existingStats);
			this.deckStats$$.next(existingStats);
		});
	}

	public async newDeckStat(stat: DraftDeckStats) {
		const user = await this.user.getCurrentUser();
		const newStat: DraftDeckStats = {
			...stat,
			userId: user.userId,
		};
		console.debug('[arena-deck-stats] saving deck stats', stat);

		const existingStats = await this.deckStats$$.getValueWithInit();
		const newStats = [...existingStats, newStat];
		this.deckStats$$.next(newStats);

		const result = await this.api.callPostApi(SAVE_URL, newStat);
		console.debug('[arena-deck-stats] uploaded deck stats');
	}
}
