/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { BgsTrinketStats } from '@firestone-hs/bgs-global-stats';
import { CardIds, CardType, SceneMode, isBattlegrounds } from '@firestone-hs/reference-data';
import { BgsTrinketCardChoiceOption, equalBgsTrinketCardChoiceOption } from '@firestone/battlegrounds/core';
import { CardOption, GameStateFacadeService, equalCardOption } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
	waitForReady,
} from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	auditTime,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	shareReplay,
	switchMap,
	tap,
} from 'rxjs';
import { BgsStateFacadeService } from './bgs-state-facade.service';
import { BattlegroundsTrinketsService } from './bgs-trinkets.service';

@Injectable()
export class BgsInGameTrinketsService extends AbstractFacadeService<BgsInGameTrinketsService> {
	public showWidget$$: BehaviorSubject<boolean | null>;
	public trinketStats$$: BehaviorSubject<readonly BgsTrinketCardChoiceOption[] | null>;

	private scene: SceneService;
	private prefs: PreferencesService;
	private gameState: GameStateFacadeService;
	private bgsGameState: BgsStateFacadeService;
	private trinkets: BattlegroundsTrinketsService;
	private allCards: CardsFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsInGameTrinketsService', () => !!this.showWidget$$);
	}

	protected override assignSubjects() {
		this.showWidget$$ = this.mainInstance.showWidget$$;
		this.trinketStats$$ = this.mainInstance.trinketStats$$;
	}

	protected async init() {
		this.showWidget$$ = new BehaviorSubject<boolean | null>(null);
		this.trinketStats$$ = new BehaviorSubject<readonly BgsTrinketCardChoiceOption[] | null>(null);
		this.scene = AppInjector.get(SceneService);
		this.prefs = AppInjector.get(PreferencesService);
		this.gameState = AppInjector.get(GameStateFacadeService);
		this.bgsGameState = AppInjector.get(BgsStateFacadeService);
		this.trinkets = AppInjector.get(BattlegroundsTrinketsService);
		this.allCards = AppInjector.get(CardsFacadeService);

		await waitForReady(this.scene, this.prefs, this.gameState, this.bgsGameState);

		const showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.bgsShowTrinketStatsOverlay),
				distinctUntilChanged(),
			),
			this.gameState.gameState$$.pipe(
				auditTime(500),
				map((state) => state?.playerDeck?.currentOptions),
			),
			this.gameState.gameState$$.pipe(
				auditTime(500),
				map((state) => state?.metadata?.gameType),
			),
		]).pipe(
			debounceTime(500),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(([currentScene, displayFromPrefs, currentOptions, gameType]) => {
				if (!displayFromPrefs) {
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
				if (!gameType || !isBattlegrounds(gameType)) {
					return false;
				}
				return true;
			}),
			distinctUntilChanged(),
			shareReplay(1),
			tap((show) => console.debug('[bgs-trinket] setting showWidget', show)),
		);
		showWidget$.subscribe((show) => {
			this.showWidget$$.next(show);
		});

		const trinkets$: Observable<BgsTrinketStats | null> = showWidget$.pipe(
			filter((show) => show),
			distinctUntilChanged(),
			switchMap(() =>
				this.bgsGameState.gameState$$.pipe(
					auditTime(500),
					map((state) => state?.currentGame?.hasTrinkets),
				),
			),
			filter((hasTrinkets) => !!hasTrinkets),
			distinctUntilChanged(),
			switchMap(() => {
				return this.trinkets.loadTrinkets('last-patch');
			}),
			map((trinkets) => trinkets ?? null),
			shareReplay(1),
			tap((trinkets) => console.debug('[bgs-trinket] setting trinkets', trinkets)),
		) as Observable<BgsTrinketStats | null>;

		const options$ = combineLatest([
			this.gameState.gameState$$.pipe(
				auditTime(500),
				map((state) => state?.playerDeck?.currentOptions),
				distinctUntilChanged(
					(a, b) =>
						a?.length === b?.length && !!a?.every((option, index) => equalCardOption(option, b?.[index])),
				),
			),
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.bgsShowTrinketStatsOverlay),
				distinctUntilChanged(),
			),
			trinkets$,
			this.bgsGameState.gameState$$.pipe(
				auditTime(500),
				map((state) => state?.currentGame?.getMainPlayer()?.cardId),
			),
		]).pipe(
			debounceTime(500),
			filter(([options, showFromPrefs, trinkets, mainPlayerCardId]) => {
				return !!trinkets && !!options?.every((o) => isBgTrinketDiscover(o, this.allCards));
			}),
			map(([options, showFromPrefs, trinkets, mainPlayerCardId]) => {
				if (!showFromPrefs) {
					return [];
				}
				return (
					options?.map((o) =>
						buildBgsTrinketCardChoiceValue(o, mainPlayerCardId ?? '', trinkets!, this.allCards),
					) ?? []
				);
			}),
			distinctUntilChanged(
				(a, b) =>
					a?.length === b?.length &&
					!!a?.every((option, index) => equalBgsTrinketCardChoiceOption(option, b?.[index])),
			),
			shareReplay(1),
		);
		options$.subscribe((options) => {
			this.trinketStats$$.next(options as any);
		});
	}
}

const isBgTrinketDiscover = (option: CardOption, allCards: CardsFacadeService): boolean => {
	return (
		option.source === CardIds.LesserTrinketToken_BG30_Trinket_1st ||
		option.source === CardIds.GreaterTrinket_BG30_Trinket_2nd ||
		allCards.getCard(option.cardId).type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET]
	);
};

const buildBgsTrinketCardChoiceValue = (
	option: CardOption,
	mainPlayerCardId: string,
	trinketStats: BgsTrinketStats,
	allCards: CardsFacadeService,
): BgsTrinketCardChoiceOption | null => {
	const bgTrinketCardId = option.cardId;
	const trinketStat = trinketStats?.trinketStats.find((s) => s.trinketCardId === bgTrinketCardId);
	if (!trinketStat) {
		return null;
	}

	return {
		cardId: option.cardId,
		dataPoints: trinketStat.dataPoints,
		averagePlacement: trinketStat.averagePlacement,
		averagePlacementTop25: trinketStat.averagePlacementAtMmr.find((p) => p.mmr === 25)!.placement,
		pickRate: trinketStat.pickRate,
		pickRateTop25: trinketStat.pickRateAtMmr.find((p) => p.mmr === 25)!.pickRate,
	};
};

const buildFakeOptions = (): readonly CardOption[] => {
	return [
		{
			cardId: CardIds.JarOGems_BG30_MagicItem_546,
			source: CardIds.LesserTrinketToken_BG30_Trinket_1st,
			entityId: 1,
			context: {
				DataNum1: 0,
			},
		},
		{
			cardId: CardIds.LavaLamp_BG30_MagicItem_951,
			source: CardIds.LesserTrinketToken_BG30_Trinket_1st,
			entityId: 2,
			context: {
				DataNum1: 0,
			},
		},
		{
			cardId: CardIds.HoggyBank_BG30_MagicItem_411,
			source: CardIds.LesserTrinketToken_BG30_Trinket_1st,
			entityId: 3,
			context: {
				DataNum1: 0,
			},
		},
		{
			cardId: CardIds.BobBlehead_BG30_MagicItem_998,
			source: CardIds.LesserTrinketToken_BG30_Trinket_1st,
			entityId: 4,
			context: {
				DataNum1: 0,
			},
		},
	];
};
