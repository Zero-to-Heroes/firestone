import { Injectable } from '@angular/core';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { ReviewMessage } from '@firestone-hs/build-global-stats/dist/review-message';
import { extractStatsForGame, mergeStats } from '@firestone-hs/build-global-stats/dist/stats-builder';
import { ManastormInfo } from '@firestone/app/common';
import { Events } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	CardsFacadeService,
	LocalStorageService,
	UserService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { GameForUpload } from '@firestone/stats/services';

const GLOBAL_STATS_ENDPOINT = 'https://quoneyok3sw7yewueok67w7cju0pzmeb.lambda-url.us-west-2.on.aws/';

@Injectable({ providedIn: 'root' })
export class GlobalStatsService extends AbstractFacadeService<GlobalStatsService> {
	public globalStats$$: SubscriberAwareBehaviorSubject<GlobalStats>;

	private api: ApiRunner;
	private localStorage: LocalStorageService;
	private user: UserService;
	private events: Events;
	private allCards: CardsFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'GlobalStatsService', () => !!this.globalStats$$);
	}

	protected override assignSubjects(): void {
		this.globalStats$$ = this.mainInstance.globalStats$$;
	}

	protected async init() {
		this.globalStats$$ = new SubscriberAwareBehaviorSubject<GlobalStats>(null);
		this.api = AppInjector.get(ApiRunner);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.user = AppInjector.get(UserService);
		this.events = AppInjector.get(Events);
		this.allCards = AppInjector.get(CardsFacadeService);

		this.globalStats$$.onFirstSubscribe(async () => {
			const localInfo = this.localStorage.getItem<GlobalStats>(LocalStorageService.USER_GLOBAL_STATS);
			if (!!localInfo?.stats?.length) {
				console.log('loaded local global stats');
				this.globalStats$$.next(localInfo);
			}

			const currentUser = await this.user.getCurrentUser();
			const remoteData = await this.api.callPostApi<{ result: GlobalStats }>(GLOBAL_STATS_ENDPOINT, {
				userName: currentUser.username,
				userId: currentUser.userId,
				machineId: currentUser.machineId,
			});
			this.localStorage.setItem(LocalStorageService.USER_GLOBAL_STATS, remoteData?.result);
			console.log('loaded remote globalStats');
		});

		this.events.on(Events.REVIEW_FINALIZED).subscribe(async (event) => {
			console.debug('[global-stats] Replay created, received info');
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-review') {
				this.updateGlobalStats(info.reviewId, info.game, info.xml);
			}
		});
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.globalStats$$, 'GlobalStatsService-globalStats');
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.globalStats$$ = new SubscriberAwareBehaviorSubject<GlobalStats>(null);
	}

	private async updateGlobalStats(reviewId: string, game: GameForUpload, xml: string) {
		const currentGlobalStats = this.globalStats$$.getValue();
		if (game.gameMode?.startsWith('mercenaries')) {
			return currentGlobalStats;
		}
		const message: ReviewMessage = {
			reviewId: reviewId,
			gameMode: game.gameMode,
			replayKey: undefined,
			playerRank: game.playerRank,
			// uploaderToken: '', // Add the required uploaderToken property
		};
		const statsFromGame = await extractStatsForGame(message, xml, this.allCards.getService());
		if (!statsFromGame?.stats) {
			return currentGlobalStats;
		}
		if (!currentGlobalStats?.stats) {
			return statsFromGame;
		}
		const mergedStats: GlobalStats = mergeStats(currentGlobalStats, statsFromGame);
		this.localStorage.setItem(LocalStorageService.USER_GLOBAL_STATS, mergedStats);
	}
}
