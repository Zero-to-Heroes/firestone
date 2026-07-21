import { Inject, Injectable } from '@angular/core';
import { ProfileClassProgress, ProfileWinsForMode } from '@firestone-hs/api-user-profile';
import { CardClass, GameType, getDefaultHeroDbfIdForClass } from '@firestone-hs/reference-data';
import { GameEvent, GameEventsEmitterService } from '@firestone/game-state';
import { MemoryInspectionService, MemoryPlayerRecord } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import {
	ACCOUNT_SERVICE_TOKEN,
	CardsFacadeService,
	IAccountFacadeForCollection,
	LocalStorageService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter } from 'rxjs';

class HeroSkinAchievements {
	readonly Golden500Win: number;
	readonly Honored1kWin: number;
}

// GameUtils.HERO_SKIN_ACHIEVEMENTS
// const ACHIEVEMENTS_FOR_HERO_CLASSES: { [playerClass: string]: HeroSkinAchievements } = {
// 	[TAG_CLASS.MAGE]: {
// 		Golden500Win: 179,
// 		Honored1kWin: 180,
// 	},
// 	[TAG_CLASS.PRIEST]: {
// 		Golden500Win: 196,
// 		Honored1kWin: 197,
// 	},
// 	[TAG_CLASS.WARLOCK]: {
// 		Golden500Win: 213,
// 		Honored1kWin: 214,
// 	},
// 	[TAG_CLASS.ROGUE]: {
// 		Golden500Win: 230,
// 		Honored1kWin: 231,
// 	},
// 	[TAG_CLASS.DRUID]: {
// 		Golden500Win: 247,
// 		Honored1kWin: 248,
// 	},
// 	[TAG_CLASS.DEMONHUNTER]: {
// 		Golden500Win: 264,
// 		Honored1kWin: 265,
// 	},
// 	[TAG_CLASS.DEATHKNIGHT]: {
// 		Golden500Win: 5520,
// 		Honored1kWin: 5521,
// 	},
// 	[TAG_CLASS.SHAMAN]: {
// 		Golden500Win: 281,
// 		Honored1kWin: 282,
// 	},
// 	[TAG_CLASS.HUNTER]: {
// 		Golden500Win: 298,
// 		Honored1kWin: 299,
// 	},
// 	[TAG_CLASS.PALADIN]: {
// 		Golden500Win: 315,
// 		Honored1kWin: 316,
// 	},
// 	[TAG_CLASS.WARRIOR]: {
// 		Golden500Win: 332,
// 		Honored1kWin: 333,
// 	},
// };

@Injectable({ providedIn: 'root' })
export class InternalProfileInfoService {
	public winsForMode$$ = new BehaviorSubject<readonly ProfileWinsForMode[]>([]);
	public classesProgress$$ = new BehaviorSubject<readonly ProfileClassProgress[]>([]);

	private shouldTrigger$$ = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly memory: MemoryInspectionService,
		private readonly allCards: CardsFacadeService,
		private readonly localStorage: LocalStorageService,
		private readonly gameStatus: GameStatusService,
		@Inject(ACCOUNT_SERVICE_TOKEN) private readonly account: IAccountFacadeForCollection,
	) {
		this.init();
	}

	private async init() {
		this.initLocalCache();
		this.initProfileInfo();
	}

	private initLocalCache() {
		this.classesProgress$$.subscribe((classProgress) => {
			console.debug('[profile-info] will update local cache', classProgress);
			if (!!classProgress?.length) {
				this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_CLASSES_PROCESS, classProgress);
			}
		});
		const cachedClassProgress = this.localStorage.getItem<readonly ProfileClassProgress[]>(
			LocalStorageService.LOCAL_STORAGE_CLASSES_PROCESS,
		);
		if (!!cachedClassProgress?.length) {
			this.classesProgress$$.next(cachedClassProgress);
		}
	}

	private async initProfileInfo() {
		// We only update the data after a game is over
		combineLatest([this.shouldTrigger$$.asObservable()])
			.pipe(
				filter(([shouldTrigger]) => shouldTrigger),
				debounceTime(2000),
			)
			.subscribe(([shouldTrigger]) => {
				this.updateProfileInfo();
			});

		await waitForReady(this.account);

		this.gameEvents.allEvents
			.pipe(filter((e) => e.type === GameEvent.GAME_END))
			.subscribe(() => this.shouldTrigger$$.next(true));
		this.account.region$$.pipe(distinctUntilChanged()).subscribe((_) => {
			this.shouldTrigger$$.next(true);
		});
		this.gameStatus.onGameStart(() => {
			this.shouldTrigger$$.next(true);
		});
	}

	private async updateProfileInfo() {
		const isInGame = await this.gameStatus.inGame();
		if (!isInGame) {
			return;
		}

		console.log('[profile-info] updating profile info');
		let profileInfo = await this.memory.getProfileInfo();
		while (!profileInfo?.PlayerRecords?.some((r) => r.Losses > 0 || r.Wins > 0)) {
			await sleep(2000);
			profileInfo = await this.memory.getProfileInfo();
			console.debug('[profile-info] still no profile info', profileInfo);
		}

		const classProgress: readonly ProfileClassProgress[] =
			profileInfo?.PlayerClasses.map((playerClass) => {
				const playerRecordsForClass =
					profileInfo.PlayerRecords.filter((r) => r.Data > 0).filter((r) =>
						this.allCards
							.getCard(r.Data)
							.classes?.filter((c) => c !== CardClass[CardClass.NEUTRAL])
							.map((c) => getDefaultHeroDbfIdForClass(c))
							.includes(getDefaultHeroDbfIdForClass(CardClass[playerClass.TagClass])),
					) ?? [];
				const winsForModes = this.buildWinsForModes(playerRecordsForClass);
				const result: ProfileClassProgress = {
					playerClass: playerClass.TagClass,
					level: playerClass.Level,
					wins: winsForModes.map((r) => r.wins).reduce((a, b) => a + b, 0),
					losses: winsForModes.map((r) => r.losses).reduce((a, b) => a + b, 0),
					ties: winsForModes.map((r) => r.ties).reduce((a, b) => a + b, 0),
					winsForModes: winsForModes,
				};
				return result;
			}) ?? [];
		// console.debug('updating profile info', classProgress);
		if (!!classProgress?.length) {
			this.classesProgress$$.next(classProgress);
		}

		const playerRecords = profileInfo?.PlayerRecords
			// Don't know what the Data field is used yet, but that's how the HS client does it
			.filter((r) => r.Data === 0)
			.filter((r) =>
				[
					GameType.GT_ARENA,
					GameType.GT_UNDERGROUND_ARENA,
					GameType.GT_RANKED,
					GameType.GT_PVPDR,
					GameType.GT_PVPDR_PAID,
				].includes(r.RecordType),
			);
		const winsForMode: readonly ProfileWinsForMode[] = this.buildWinsForModes(playerRecords ?? []);
		console.debug('[profile-info] updated profile info', winsForMode, classProgress, profileInfo);
		if (!!winsForMode?.length) {
			this.winsForMode$$.next(winsForMode);
		}
	}

	// TODO-arena
	private buildWinsForModes(playerRecords: MemoryPlayerRecord[]) {
		if (!playerRecords?.length) {
			return [];
		}

		const winsForMode: readonly ProfileWinsForMode[] = ['constructed', 'arena'].map((mode: string) => {
			const recordsForMode = playerRecords.filter((r) =>
				mode === 'constructed'
					? r.RecordType === GameType.GT_RANKED
					: mode === 'arena'
						? r.RecordType === GameType.GT_ARENA || r.RecordType === GameType.GT_UNDERGROUND_ARENA
						: r.RecordType === GameType.GT_PVPDR || r.RecordType === GameType.GT_PVPDR_PAID,
			);
			const result: ProfileWinsForMode = {
				mode: mode as 'constructed' | 'arena',
				wins: recordsForMode.map((r) => r.Wins).reduce((a, b) => a + b, 0),
				losses: recordsForMode.map((r) => r.Losses).reduce((a, b) => a + b, 0),
				ties: recordsForMode.map((r) => r.Ties).reduce((a, b) => a + b, 0),
			};
			return result;
		});
		return winsForMode;
	}
}
