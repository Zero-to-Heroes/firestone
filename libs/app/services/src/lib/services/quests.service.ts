import { Injectable } from '@angular/core';
import { QuestsInfo, RewardTrackType } from '@firestone-hs/reference-data';
import {
	equalMemoryQuestsLog,
	MemoryInspectionService,
	MemoryQuestsLog,
	RewardsTrackInfo,
	SceneService,
} from '@firestone/memory';
import { GameStatusService, PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	LocalStorageService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, take } from 'rxjs/operators';

const REFERENCE_QUESTS_URL = 'https://static.firestoneapp.com/data/quests/quests-data_%locale%.gz.json';

@Injectable({ providedIn: 'root' })
export class QuestsService extends AbstractFacadeService<QuestsService> {
	public referenceQuests$$: SubscriberAwareBehaviorSubject<QuestsInfo | null>;
	public activeQuests$$: SubscriberAwareBehaviorSubject<MemoryQuestsLog | null>;
	public xpBonus: number | undefined;

	private api: ApiRunner;
	private localStorage: LocalStorageService;
	private prefs: PreferencesService;
	private memory: MemoryInspectionService;
	private gameStatus: GameStatusService;
	private scene: SceneService;

	constructor(windowManager: WindowManagerService) {
		super(windowManager, 'QuestsService', () => !!this.referenceQuests$$);
	}

	protected assignSubjects(): void {
		this.referenceQuests$$ = this.mainInstance.referenceQuests$$;
		this.activeQuests$$ = this.mainInstance.activeQuests$$;
		this.xpBonus = this.mainInstance.xpBonus;
	}

	protected async init() {
		this.referenceQuests$$ = new SubscriberAwareBehaviorSubject<QuestsInfo | null>(null);
		this.activeQuests$$ = new SubscriberAwareBehaviorSubject<MemoryQuestsLog | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.prefs = AppInjector.get(PreferencesService);
		this.memory = AppInjector.get(MemoryInspectionService);
		this.gameStatus = AppInjector.get(GameStatusService);
		this.scene = AppInjector.get(SceneService);

		await waitForReady(this.scene, this.prefs);

		this.referenceQuests$$.onFirstSubscribe(async () => {
			combineLatest([
				this.gameStatus.inGame$$,
				this.prefs.preferences$$.pipe(
					map((prefs) => prefs.enableQuestsWidget),
					distinctUntilChanged(),
				),
			])
				.pipe(
					filter(([inGame, enableQuestsWidget]) => !!inGame && enableQuestsWidget),
					take(1),
				)
				.subscribe(() => {
					this.prefs.preferences$$
						.pipe(
							map((prefs) => prefs.locale),
							distinctUntilChanged(),
						)
						.subscribe(async (locale) => {
							await this.loadReferenceQuests(locale);
						});
				});
		});

		this.activeQuests$$.onFirstSubscribe(async () => {
			this.scene.currentScene$$
				// Assumption for now is that quests can only be completed during gameplay
				// Also, quests are not updated live while playing
				// TODO: doesn't account for rerolls
				.pipe(
					switchMap((scene) => this.memory.getActiveQuests()),
					distinctUntilChanged((a, b) => equalMemoryQuestsLog(a, b)),
				)
				.subscribe(async (activeQuests) => {
					this.activeQuests$$.next(activeQuests);
					const rewardsTrackInfos = await this.memory.getRewardsTrackInfo();
					if (!!rewardsTrackInfos) {
						const rewardTrackInfo: RewardsTrackInfo | undefined = rewardsTrackInfos?.TrackEntries?.find(
							(track) => track.TrackType === RewardTrackType.GLOBAL,
						);
						this.xpBonus = rewardTrackInfo?.XpBonusPercent;
					}
				});
		});
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.referenceQuests$$, 'QuestsService-referenceQuests');
		this.setupElectronSubject(this.activeQuests$$, 'QuestsService-activeQuests');
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.referenceQuests$$ = new SubscriberAwareBehaviorSubject<QuestsInfo | null>(null);
		this.activeQuests$$ = new SubscriberAwareBehaviorSubject<MemoryQuestsLog | null>(null);
	}

	private async loadReferenceQuests(locale?: string) {
		const localInfo = this.localStorage.getItem<QuestsInfo>(LocalStorageService.REFERENCE_QUESTS);
		if (!!localInfo?.quests?.length) {
			console.log('[quests] loaded local reference quests');
			this.referenceQuests$$.next(localInfo);
		}

		locale = locale ?? (await this.prefs.getPreferences()).locale;
		const result = await this.api.callGetApi<QuestsInfo>(REFERENCE_QUESTS_URL.replace('%locale%', locale));
		this.localStorage.setItem(LocalStorageService.REFERENCE_QUESTS, result);
		this.referenceQuests$$.next(result);
	}
}
