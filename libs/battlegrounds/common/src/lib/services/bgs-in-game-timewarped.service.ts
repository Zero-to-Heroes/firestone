/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { BgsCardStats } from '@firestone-hs/bgs-global-stats';
import { SceneMode, isBattlegrounds } from '@firestone-hs/reference-data';
import {
	BgsTimewarpedCardChoiceOption,
	GameStateFacadeService,
	equalBgsTimewarpedCardChoiceOption,
} from '@firestone/game-state';
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
import { BattlegroundsCardsService } from '../cards/bgs-cards.service';

// The turn when the timewarped shop appears (turn 1 in HS = turn 1 on our side)
const TIMEWARPED_TURN = 1;

@Injectable()
export class BgsInGameTimewarpedService extends AbstractFacadeService<BgsInGameTimewarpedService> {
	public showWidget$$: BehaviorSubject<boolean | null>;
	public timewarpedStats$$: BehaviorSubject<readonly BgsTimewarpedCardChoiceOption[] | null>;

	private scene: SceneService;
	private prefs: PreferencesService;
	private gameState: GameStateFacadeService;
	private cardsService: BattlegroundsCardsService;
	private allCards: CardsFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsInGameTimewarpedService', () => !!this.showWidget$$);
	}

	protected override assignSubjects() {
		this.showWidget$$ = this.mainInstance.showWidget$$;
		this.timewarpedStats$$ = this.mainInstance.timewarpedStats$$;
	}

	protected async init() {
		this.showWidget$$ = new BehaviorSubject<boolean | null>(null);
		this.timewarpedStats$$ = new BehaviorSubject<readonly BgsTimewarpedCardChoiceOption[] | null>(null);
		this.scene = AppInjector.get(SceneService);
		this.prefs = AppInjector.get(PreferencesService);
		this.gameState = AppInjector.get(GameStateFacadeService);
		this.cardsService = AppInjector.get(BattlegroundsCardsService);
		this.allCards = AppInjector.get(CardsFacadeService);

		await waitForReady(this.scene, this.prefs, this.gameState);

		const showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.bgsShowTimewarpedStatsOverlay),
				distinctUntilChanged(),
			),
			this.gameState.gameState$$.pipe(
				auditTime(500),
				map((state) => state?.bgState?.currentGame?.inTimewarpedTavern),
				distinctUntilChanged(),
			),
			this.gameState.gameState$$.pipe(
				auditTime(500),
				map((state) => state?.metadata?.gameType),
			),
		]).pipe(
			debounceTime(500),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(([currentScene, displayFromPrefs, inTimewarpedTavern, gameType]) => {
				if (!displayFromPrefs) {
					return false;
				}
				// We explicitly don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}
				if (!inTimewarpedTavern) {
					return false;
				}
				if (!gameType || !isBattlegrounds(gameType)) {
					return false;
				}
				return true;
			}),
			distinctUntilChanged(),
			shareReplay(1),
			tap((show) => console.debug('[bgs-timewarped] setting showWidget', show)),
		);
		showWidget$.subscribe((show) => {
			this.showWidget$$.next(show);
		});

		const cardStats$: Observable<BgsCardStats | null> = showWidget$.pipe(
			filter((show) => show),
			distinctUntilChanged(),
			switchMap(() =>
				this.gameState.gameState$$.pipe(
					auditTime(500),
					map((state) => state?.bgState?.currentGame?.hasTimewarped),
				),
			),
			filter((hasTimewarped) => !!hasTimewarped),
			distinctUntilChanged(),
			switchMap(() => {
				return this.cardsService.loadCardStats('last-patch', 25);
			}),
			map((cardStats) => cardStats ?? null),
			shareReplay(1),
			tap((cardStats) => console.debug('[bgs-timewarped] loaded cardStats', cardStats)),
		) as Observable<BgsCardStats | null>;

		const shopCards$ = this.gameState.gameState$$.pipe(
			filter((state) => state != null),
			auditTime(500),
			map((state) => state!.opponentDeck.board.map((entity) => entity.cardId)),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		);

		const options$ = combineLatest([
			shopCards$,
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.bgsShowTimewarpedStatsOverlay),
				distinctUntilChanged(),
			),
			cardStats$,
		]).pipe(
			debounceTime(500),
			filter(([shopCards, showFromPrefs, cardStats]) => {
				return !!cardStats && !!shopCards?.length;
			}),
			map(([shopCards, showFromPrefs, cardStats]) => {
				if (!showFromPrefs) {
					return [];
				}
				return shopCards
					.map((cardId) => buildBgsTimewarpedCardChoiceValue(cardId, cardStats!, this.allCards))
					.filter((option) => option !== null) as readonly BgsTimewarpedCardChoiceOption[];
			}),
			distinctUntilChanged(
				(a, b) =>
					a?.length === b?.length &&
					!!a?.every((option, index) => equalBgsTimewarpedCardChoiceOption(option, b?.[index])),
			),
			shareReplay(1),
		);
		options$.subscribe((options) => {
			this.timewarpedStats$$.next(options);
		});
	}
}

const buildBgsTimewarpedCardChoiceValue = (
	cardId: string,
	cardStats: BgsCardStats,
	allCards: CardsFacadeService,
): BgsTimewarpedCardChoiceOption | null => {
	const cardStat = cardStats?.cardStats?.find((s) => s.cardId === cardId);
	if (!cardStat) {
		return null;
	}

	// Use turn 1 stats for timewarped shop
	const turnStat = cardStat.turnStats?.find((s) => s.turn === TIMEWARPED_TURN);
	if (!turnStat) {
		return null;
	}

	const impact = turnStat.averagePlacement - turnStat.averagePlacementOther;
	return {
		cardId: cardId,
		dataPoints: turnStat.totalPlayed,
		averagePlacement: turnStat.averagePlacement,
		impact: impact,
	};
};
