import { Injectable } from '@angular/core';
import { DraftDeckStats } from '@firestone-hs/arena-draft-pick';
import { AccountService } from '@firestone/profile/common';
import { DiskCacheService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	ARENA_DECK_STATS,
	IndexedDbService,
	UserService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { ExtendedDraftDeckStats } from '../models/arena-draft';

const SAVE_URL = `https://kfudiyqjqqra5cvjbt543ippfe0xzbjv.lambda-url.us-west-2.on.aws/`;
const RETRIEVE_URL = 'https://oqskvzs6pjzhrcsg54z7tvnxoe0fmuyw.lambda-url.us-west-2.on.aws/';

@Injectable()
export class ArenaDeckStatsService extends AbstractFacadeService<ArenaDeckStatsService> {
	public deckStats$$: SubscriberAwareBehaviorSubject<readonly ExtendedDraftDeckStats[] | null>;

	private api: ApiRunner;
	private user: UserService;
	private diskCache: DiskCacheService;
	private db: IndexedDbService;
	private account: AccountService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaDeckStatsService', () => !!this.deckStats$$);
	}

	protected override assignSubjects() {
		this.deckStats$$ = this.mainInstance.deckStats$$;
	}

	protected async init() {
		this.deckStats$$ = new SubscriberAwareBehaviorSubject<readonly ExtendedDraftDeckStats[] | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.user = AppInjector.get(UserService);
		this.diskCache = AppInjector.get(DiskCacheService);
		this.db = AppInjector.get(IndexedDbService);
		this.account = AppInjector.get(AccountService);

		this.deckStats$$.onFirstSubscribe(async () => {
			const currentUser = await this.user.getCurrentUser();
			const existingStats: readonly ExtendedDraftDeckStats[] | null = await this.loadArenaDeckStats(currentUser);
			this.deckStats$$.next(existingStats);
		});
	}

	public async newDeckStat(stat: DraftDeckStats, isFinalDeck: boolean) {
		const user = await this.user.getCurrentUser();
		const region = this.account.region$$.getValue();
		const newStat: ExtendedDraftDeckStats = {
			...stat,
			region: region,
			userId: user?.userId ?? '',
		};
		console.debug('[arena-deck-stats] saving deck stats', stat);

		const existingStats = await this.deckStats$$.getValueWithInit();
		const newStats = [newStat, ...(existingStats ?? []).filter((s) => s.runId !== newStat.runId)];
		this.deckStats$$.next(newStats);

		this.db.table<DraftDeckStats, string>(ARENA_DECK_STATS).put(newStat);
		if (isFinalDeck) {
			const result = await this.api.callPostApi(SAVE_URL, newStat);
			console.debug('[arena-deck-stats] uploaded deck stats');
			// Delete all from the ARENA_CURRENT_DECK_PICKS table
			// await this.db.table<DraftPick, string>(ARENA_CURRENT_DECK_PICKS).clear();
		}
	}

	private async loadArenaDeckStats(
		currentUser: overwolf.profile.GetCurrentUserResult | null,
		skipLocal = false,
	): Promise<readonly ExtendedDraftDeckStats[] | null> {
		if (!skipLocal) {
			const dbResults = await this.db.table<ExtendedDraftDeckStats, string>(ARENA_DECK_STATS).toArray();
			if (dbResults?.length) {
				return dbResults;
			}

			const localRewards = await this.diskCache.getItem<readonly ExtendedDraftDeckStats[]>(
				DiskCacheService.DISK_CACHE_KEYS.ARENA_DECK_STATS,
			);
			if (localRewards != null) {
				this.db.table<ExtendedDraftDeckStats, string>(ARENA_DECK_STATS).bulkPut(localRewards);
				return localRewards;
			}
		}

		const resultFromRemote = await this.api.callPostApi<readonly ExtendedDraftDeckStats[] | null>(RETRIEVE_URL, {
			userId: currentUser?.userId,
			userName: currentUser?.username,
		});
		console.debug('[arena-deck-stats] retrieved deck stats', resultFromRemote);
		const result = resultFromRemote ?? [];
		this.db.table<DraftDeckStats, string>(ARENA_DECK_STATS).bulkPut(result);
		return result;
	}
}
