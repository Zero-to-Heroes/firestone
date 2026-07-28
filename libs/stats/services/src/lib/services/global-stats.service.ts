import { Injectable } from '@angular/core';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { ReviewMessage } from '@firestone-hs/build-global-stats/dist/review-message';
import { extractStatsForGame, mergeStats } from '@firestone-hs/build-global-stats/dist/stats-builder';
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
import { GameForUpload } from '../models/game-for-upload/game-for-upload';
import { UploadPrepExecutorService } from './upload-prep-executor.service';

const GLOBAL_STATS_ENDPOINT = 'https://quoneyok3sw7yewueok67w7cju0pzmeb.lambda-url.us-west-2.on.aws/';

interface ReviewFinalizedInfo {
	readonly type: string;
	readonly reviewId: string;
	readonly game: GameForUpload;
	readonly xml: string;
}

@Injectable({ providedIn: 'root' })
export class GlobalStatsService extends AbstractFacadeService<GlobalStatsService> {
	public globalStats$$: SubscriberAwareBehaviorSubject<GlobalStats | null>;

	private api: ApiRunner;
	private localStorage: LocalStorageService;
	private user: UserService;
	private events: Events;
	private allCards: CardsFacadeService;
	private uploadPrep: UploadPrepExecutorService | null;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'GlobalStatsService', () => !!this.globalStats$$);
	}

	protected override assignSubjects(): void {
		this.globalStats$$ = this.mainInstance.globalStats$$;
	}

	protected async init() {
		this.globalStats$$ = new SubscriberAwareBehaviorSubject<GlobalStats | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.user = AppInjector.get(UserService);
		this.events = AppInjector.get(Events);
		this.allCards = AppInjector.get(CardsFacadeService);
		// When present (Electron compute worker / Overwolf web worker), the replay-XML
		// parse runs in a worker instead of blocking the calling thread (Plan H)
		this.uploadPrep = AppInjector.get(UploadPrepExecutorService, null);

		this.globalStats$$.onFirstSubscribe(async () => {
			const localInfo = this.localStorage.getItem<GlobalStats>(LocalStorageService.USER_GLOBAL_STATS);
			if (!!localInfo?.stats?.length) {
				console.log('loaded local global stats');
				this.globalStats$$.next(localInfo);
			}

			const currentUser = await this.user.getCurrentUser();
			if (!currentUser) {
				return;
			}
			const remoteData = await this.api.callPostApi<{ result: GlobalStats }>(GLOBAL_STATS_ENDPOINT, {
				userName: currentUser.username,
				userId: currentUser.userId,
				machineId: currentUser.machineId,
			});
			if (remoteData?.result != null) {
				this.localStorage.setItem(LocalStorageService.USER_GLOBAL_STATS, remoteData.result);
			}
			console.log('loaded remote globalStats');
		});

		this.events.on(Events.REVIEW_FINALIZED).subscribe(async (event) => {
			console.debug('[global-stats] Replay created, received info');
			const info: ReviewFinalizedInfo = event.data[0];
			if (info && info.type === 'new-review') {
				this.updateGlobalStats(info.reviewId, info.game, info.xml);
			}
		});
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.globalStats$$, 'GlobalStatsService-globalStats');
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.globalStats$$ = new SubscriberAwareBehaviorSubject<GlobalStats | null>(null);
	}

	private async updateGlobalStats(
		reviewId: string,
		game: GameForUpload,
		xml: string,
	): Promise<GlobalStats | null | undefined> {
		const currentGlobalStats = this.globalStats$$.getValue();
		if (game.gameMode?.startsWith('mercenaries')) {
			return currentGlobalStats;
		}
		const message: ReviewMessage = {
			reviewId: reviewId,
			gameMode: game.gameMode,
			replayKey: '',
			playerRank: game.playerRank,
			uploaderToken: '',
		};
		const statsFromGame =
			(await this.uploadPrep?.extractStatsForGame(message, xml)) ??
			(await extractStatsForGame(message, xml, this.allCards.getService()));
		if (!statsFromGame?.stats) {
			return currentGlobalStats;
		}
		if (!currentGlobalStats?.stats) {
			return statsFromGame;
		}
		const mergedStats: GlobalStats = mergeStats(currentGlobalStats, statsFromGame);
		this.localStorage.setItem(LocalStorageService.USER_GLOBAL_STATS, mergedStats);
		return mergedStats;
	}
}
