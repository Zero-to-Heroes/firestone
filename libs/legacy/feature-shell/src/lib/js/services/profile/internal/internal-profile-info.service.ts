import { Injectable } from '@angular/core';
import { ProfileClassProgress, ProfileWinsForMode } from '@firestone-hs/api-user-profile';
import { CardClass, GameType, CardClass as TAG_CLASS, getDefaultHeroDbfIdForClass } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter, map, withLatestFrom } from 'rxjs';
import { GameEvent } from '../../../models/game-event';
import { HsAchievementInfo } from '../../achievement/achievements-info';
import { AchievementsMemoryMonitor } from '../../achievement/data/achievements-memory-monitor.service';
import { GameEventsEmitterService } from '../../game-events-emitter.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { MemoryPlayerRecord } from '../../plugins/mind-vision/operations/get-profile-info-operation';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../../utils';

class HeroSkinAchievements {
	readonly Golden500Win: number;
	readonly Honored1kWin: number;
}

// GameUtils.HERO_SKIN_ACHIEVEMENTS
const ACHIEVEMENTS_FOR_HERO_CLASSES: { [playerClass: string]: HeroSkinAchievements } = {
	[TAG_CLASS.MAGE]: {
		Golden500Win: 179,
		Honored1kWin: 180,
	},
	[TAG_CLASS.PRIEST]: {
		Golden500Win: 196,
		Honored1kWin: 197,
	},
	[TAG_CLASS.WARLOCK]: {
		Golden500Win: 213,
		Honored1kWin: 214,
	},
	[TAG_CLASS.ROGUE]: {
		Golden500Win: 230,
		Honored1kWin: 231,
	},
	[TAG_CLASS.DRUID]: {
		Golden500Win: 247,
		Honored1kWin: 248,
	},
	[TAG_CLASS.DEMONHUNTER]: {
		Golden500Win: 264,
		Honored1kWin: 265,
	},
	[TAG_CLASS.DEATHKNIGHT]: {
		Golden500Win: 5520,
		Honored1kWin: 5521,
	},
	[TAG_CLASS.SHAMAN]: {
		Golden500Win: 281,
		Honored1kWin: 282,
	},
	[TAG_CLASS.HUNTER]: {
		Golden500Win: 298,
		Honored1kWin: 299,
	},
	[TAG_CLASS.PALADIN]: {
		Golden500Win: 315,
		Honored1kWin: 316,
	},
	[TAG_CLASS.WARRIOR]: {
		Golden500Win: 332,
		Honored1kWin: 333,
	},
};

@Injectable()
export class InternalProfileInfoService {
	public winsForMode$$ = new BehaviorSubject<readonly ProfileWinsForMode[]>([]);
	public classesProgress$$ = new BehaviorSubject<readonly ProfileClassProgress[]>([]);

	private shouldTrigger$$ = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly achievementsMonitor: AchievementsMemoryMonitor,
		private readonly gameEvents: GameEventsEmitterService,
		private readonly memory: MemoryInspectionService,
		private readonly allCards: CardsFacadeService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		this.initProfileInfo();
	}

	private initProfileInfo() {
		const allClassUnlockAchievements = Object.values(ACHIEVEMENTS_FOR_HERO_CLASSES).flatMap((info) => [
			info.Golden500Win,
			info.Honored1kWin,
		]);

		this.gameEvents.allEvents
			.pipe(filter((e) => e.type === GameEvent.GAME_END))
			.subscribe(() => this.shouldTrigger$$.next(true));

		const classAchievements$ = this.achievementsMonitor.nativeAchievements$$.pipe(
			debounceTime(2000),
			filter((achievements) => !!achievements?.length),
			map((achievements) => achievements.filter((ach) => allClassUnlockAchievements.includes(ach.id))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		);
		// We only update the data after a game is over
		combineLatest([this.store.enablePremiumFeatures$(), this.shouldTrigger$$.asObservable()])
			.pipe(
				filter(([premium, shouldTrigger]) => premium && shouldTrigger),
				debounceTime(2000),
				withLatestFrom(classAchievements$),
			)
			.subscribe(([[premium, shouldTrigger], classAchievements]) => {
				this.updateProfileInfo(classAchievements);
			});
		this.shouldTrigger$$.next(true);
	}

	private async updateProfileInfo(classAchievements: readonly HsAchievementInfo[]) {
		const profileInfo = await this.memory.getProfileInfo();
		const classProgress: readonly ProfileClassProgress[] = profileInfo.PlayerClasses.map((playerClass) => {
			const playerRecordsForClass = profileInfo.PlayerRecords.filter((r) => r.Data > 0).filter((r) =>
				this.allCards
					.getCard(r.Data)
					.classes.filter((c) => c !== CardClass[CardClass.NEUTRAL])
					.map((c) => getDefaultHeroDbfIdForClass(c))
					.includes(getDefaultHeroDbfIdForClass(CardClass[playerClass.TagClass])),
			);
			// console.debug(
			// 	'playerRecordsForClass',
			// 	CardClass[playerClass.TagClass],
			// 	playerClass.TagClass,
			// 	playerRecordsForClass,
			// );
			const recordsThatCount = playerRecordsForClass.filter((r) =>
				[GameType.GT_ARENA, GameType.GT_RANKED, GameType.GT_PVPDR, GameType.GT_PVPDR_PAID].includes(
					r.RecordType,
				),
			);
			const winsForModes = this.buildWinsForModes(recordsThatCount);
			// const refAchievementForClass = ACHIEVEMENTS_FOR_HERO_CLASSES[playerClass.TagClass];
			// const golden500Win = classAchievements.find((ach) => ach.id === refAchievementForClass.Golden500Win);
			// const honored1kWin = classAchievements.find((ach) => ach.id === refAchievementForClass.Honored1kWin);
			const result: ProfileClassProgress = {
				playerClass: playerClass.TagClass,
				level: playerClass.Level,
				wins: recordsThatCount.map((r) => r.Wins).reduce((a, b) => a + b, 0),
				losses: recordsThatCount.map((r) => r.Losses).reduce((a, b) => a + b, 0),
				ties: recordsThatCount.map((r) => r.Ties).reduce((a, b) => a + b, 0),
				winsForModes: winsForModes,
			};
			return result;
		});
		this.classesProgress$$.next(classProgress);

		const playerRecords = profileInfo.PlayerRecords
			// Don't know what the Data field is used yet, but that's how the HS client does it
			.filter((r) => r.Data === 0)
			.filter((r) =>
				[GameType.GT_ARENA, GameType.GT_RANKED, GameType.GT_PVPDR, GameType.GT_PVPDR_PAID].includes(
					r.RecordType,
				),
			);
		const winsForMode: readonly ProfileWinsForMode[] = this.buildWinsForModes(playerRecords);
		this.winsForMode$$.next(winsForMode);
	}

	private buildWinsForModes(playerRecords: MemoryPlayerRecord[]) {
		const winsForMode: readonly ProfileWinsForMode[] = ['constructed', 'duels', 'arena'].map(
			(mode: 'constructed' | 'duels' | 'arena') => {
				const recordsForMode = playerRecords.filter((r) =>
					mode === 'constructed'
						? r.RecordType === GameType.GT_RANKED
						: mode === 'arena'
						? r.RecordType === GameType.GT_ARENA
						: r.RecordType === GameType.GT_PVPDR || r.RecordType === GameType.GT_PVPDR_PAID,
				);
				const result: ProfileWinsForMode = {
					mode: mode,
					wins: recordsForMode.map((r) => r.Wins).reduce((a, b) => a + b, 0),
					losses: recordsForMode.map((r) => r.Losses).reduce((a, b) => a + b, 0),
					ties: recordsForMode.map((r) => r.Ties).reduce((a, b) => a + b, 0),
				};
				return result;
			},
		);
		return winsForMode;
	}
}
