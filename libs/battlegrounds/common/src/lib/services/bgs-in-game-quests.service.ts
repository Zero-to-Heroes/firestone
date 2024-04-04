import { Injectable } from '@angular/core';
import { BgsQuestStats } from '@firestone-hs/bgs-global-stats';
import { CardIds, GameType, SceneMode, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/constructed/common';
import { CardOption } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual, deepEqual } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	shareReplay,
	switchMap,
	tap,
} from 'rxjs';
import { BgsQuestCardChoiceOption } from '../model/quests-in-game';
import { BgsGameStateFacadeService } from './bgs-game-state-facade.service';
import { BG_USE_QUESTS } from './bgs-in-game-quests-guardian.service';
import { BattlegroundsQuestsService } from './bgs-quests.service';

export const IN_GAME_RANK_FILTER = 50;

@Injectable()
export class BgsInGameQuestsService extends AbstractFacadeService<BgsInGameQuestsService> {
	public showWidget$$: BehaviorSubject<boolean | null>;
	public questStats$$: BehaviorSubject<readonly BgsQuestCardChoiceOption[] | null>;

	private scene: SceneService;
	private prefs: PreferencesService;
	private gameState: GameStateFacadeService;
	private bgsGameState: BgsGameStateFacadeService;
	private quests: BattlegroundsQuestsService;
	private allCards: CardsFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsInGameQuestsService', () => !!this.showWidget$$);
	}

	protected override assignSubjects() {
		this.showWidget$$ = this.mainInstance.showWidget$$;
		this.questStats$$ = this.mainInstance.questStats$$;
	}

	protected async init() {
		this.showWidget$$ = new BehaviorSubject<boolean | null>(null);
		this.questStats$$ = new BehaviorSubject<readonly BgsQuestCardChoiceOption[] | null>(null);
		this.scene = AppInjector.get(SceneService);
		this.prefs = AppInjector.get(PreferencesService);
		this.gameState = AppInjector.get(GameStateFacadeService);
		this.bgsGameState = AppInjector.get(BgsGameStateFacadeService);
		this.quests = AppInjector.get(BattlegroundsQuestsService);
		this.allCards = AppInjector.get(CardsFacadeService);

		await Promise.all([
			this.scene.isReady(),
			this.prefs.isReady(),
			this.gameState.isReady(),
			this.bgsGameState.isReady(),
		]);

		if (!BG_USE_QUESTS) {
			return;
		}

		const showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferencesSingle$((prefs) => prefs.bgsShowQuestStatsOverlay),
			this.gameState.gameState$$.pipe(map((state) => state?.playerDeck?.currentOptions)),
			this.gameState.gameState$$.pipe(map((state) => state?.metadata?.gameType)),
		]).pipe(
			debounceTime(500),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			tap((data) => console.debug('[bgs-quest] will show?', data)),
			map(([currentScene, displayFromPrefs, currentOptions, gameType]) => {
				if (!displayFromPrefs || !BG_USE_QUESTS) {
					return false;
				}
				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}
				if (!currentOptions?.length) {
					return false;
				}
				if (!gameType || ![GameType.GT_BATTLEGROUNDS, GameType.GT_BATTLEGROUNDS_FRIENDLY].includes(gameType)) {
					return false;
				}
				return true;
			}),
			distinctUntilChanged(),
			shareReplay(1),
			tap((show) => console.debug('[bgs-quest] showWidget', show)),
		);
		showWidget$.subscribe((show) => {
			this.showWidget$$.next(show);
		});

		const quests$: Observable<BgsQuestStats> = showWidget$.pipe(
			filter((show) => show),
			distinctUntilChanged(),
			switchMap(() => this.bgsGameState.gameState$$.pipe(map((state) => state?.currentGame?.hasQuests))),
			filter((hasQuests) => !!hasQuests),
			distinctUntilChanged(),
			switchMap(() =>
				this.bgsGameState.gameState$$.pipe(
					map((state) => ({
						playerRank: state?.currentGame?.mmrAtStart,
						availableRaces: state?.currentGame?.availableRaces,
					})),
				),
			),
			debounceTime(500),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			switchMap(({ playerRank, availableRaces }) => {
				return this.quests.loadQuests('last-patch', IN_GAME_RANK_FILTER);
			}),
			map((quests) => {
				return quests;
			}),
			shareReplay(1),
		) as Observable<BgsQuestStats>;

		const options$ = combineLatest([
			this.gameState.gameState$$.pipe(map((state) => state?.playerDeck?.currentOptions)),
			this.prefs.preferences$$.pipe(map((prefs) => prefs.bgsShowQuestStatsOverlay)),
			quests$,
			this.bgsGameState.gameState$$.pipe(map((state) => state?.currentGame?.getMainPlayer()?.cardId)),
		]).pipe(
			debounceTime(500),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			filter(([options, bgsShowQuestStatsOverlay, quests, mainPlayerCardId]) => {
				return options?.every((o) => isBgQuestDiscover(o.source)) ?? false;
			}),
			map(([options, bgsShowQuestStatsOverlay, quests, mainPlayerCardId]) => {
				console.debug('[bgs-quest] building options', options);
				if (!bgsShowQuestStatsOverlay) {
					return null;
				}
				return (
					options?.map((o) =>
						buildBgsQuestCardChoiceValue(o, mainPlayerCardId ?? '', quests, this.allCards),
					) ?? []
				);
			}),
			shareReplay(1),
		);
		options$.subscribe((options) => {
			this.questStats$$.next(options as any);
		});
	}
}

const isBgQuestDiscover = (source: string): boolean => {
	return source === CardIds.DiscoverQuestRewardDntToken;
};

const buildBgsQuestCardChoiceValue = (
	option: CardOption,
	mainPlayerCardId: string,
	bgsQuests: BgsQuestStats,
	allCards: CardsFacadeService,
): BgsQuestCardChoiceOption | null => {
	const bgQuestCardId = option.cardId;
	const questStat = bgsQuests?.questStats.find((s) => s.questCardId === bgQuestCardId);
	// console.debug('questStat', questStat, mainPlayerCardId);

	const rewardStat = bgsQuests.rewardStats.find((r) => r.rewardCardId === option.questReward?.CardId);
	// console.debug('rewardStat', rewardStat);
	if (!questStat || !rewardStat) {
		return null;
	}

	const questStatForHero = questStat?.heroStats.find(
		(s) => s.heroCardId === normalizeHeroCardId(mainPlayerCardId, allCards),
	);
	const filteredStatForHero = (questStatForHero?.dataPoints ?? 0) > 20 ? questStatForHero : null;
	// console.debug('statForHero', questStatForHero, mainPlayerCardId, questStat.heroStats);

	const questStatForDifficulty = questStat?.difficultyStats?.find((s) => s.difficulty === option.questDifficulty);
	const filteredStatForDifficulty = (questStatForDifficulty?.dataPoints ?? 0) > 20 ? questStatForDifficulty : null;
	// console.debug('statForDifficulty', questStatForDifficulty, option.questDifficulty);

	// const turnsToCompleteImpact = filteredStatForDifficulty?.impactTurnToComplete ?? 0;
	// console.debug('turnsToCompleteImpact', turnsToCompleteImpact, filteredStatForDifficulty);

	const rewardHeroStat = rewardStat.heroStats.find(
		(s) => s.heroCardId === normalizeHeroCardId(mainPlayerCardId, allCards),
	);
	const filteredRewardHeroStat = (rewardHeroStat?.dataPoints ?? 0) > 20 ? rewardHeroStat : null;

	return {
		cardId: option.cardId,
		quest: {
			dataPoints: questStat.dataPoints,
			heroDataPoints: questStatForHero?.dataPoints ?? 0,
			difficultyDataPoints: questStatForDifficulty?.dataPoints ?? 0,
			averageTurnsToComplete: questStat.averageTurnToComplete / 2 + 1,
			averageTurnsToCompleteForHero: filteredStatForHero?.averageTurnToComplete
				? filteredStatForHero.averageTurnToComplete / 2 + 1
				: null,
			averageTurnsToCompleteForDifficulty: filteredStatForDifficulty?.averageTurnToComplete
				? filteredStatForDifficulty.averageTurnToComplete / 2 + 1
				: null,
		},
		reward: {
			dataPoints: rewardStat.dataPoints,
			heroDataPoints: rewardHeroStat?.dataPoints ?? 0,
			averagePosition: rewardStat.averagePlacement,
			averagePositionForHero: filteredRewardHeroStat?.averagePlacement ?? null,
		},
	};
};
