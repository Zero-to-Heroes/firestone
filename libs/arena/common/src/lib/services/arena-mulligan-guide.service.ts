/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { decode } from '@firestone-hs/deckstrings';
import { CardClass, GameType, SceneMode, getBaseCardId, isCoin } from '@firestone-hs/reference-data';
import { MulliganCardAdvice, MulliganGuide } from '@firestone/constructed/common';
import { GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual, deepEqual } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	IAdsService,
	WindowManagerService,
	waitForReady,
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
import { ArenaCardStatsService } from './arena-card-stats.service';
import { ArenaClassStatsService } from './arena-class-stats.service';
import { MULLIGAN_GUIDE_IS_ENABLED } from './arena-mulligan-guide-guardian.service';

export const CARD_IN_HAND_AFTER_MULLIGAN_THRESHOLD = 20;

@Injectable()
export class ArenaMulliganGuideService extends AbstractFacadeService<ArenaMulliganGuideService> {
	public mulliganAdvice$$: BehaviorSubject<MulliganGuide | null>;

	private scene: SceneService;
	private prefs: PreferencesService;
	private gameState: GameStateFacadeService;
	private ads: IAdsService;
	private allCards: CardsFacadeService;
	private cardStats: ArenaCardStatsService;
	private classStats: ArenaClassStatsService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaMulliganGuideService', () => !!this.mulliganAdvice$$);
	}

	protected override assignSubjects() {
		this.mulliganAdvice$$ = this.mainInstance.mulliganAdvice$$;
	}

	protected async init() {
		this.mulliganAdvice$$ = new BehaviorSubject<MulliganGuide | null>(null);
		this.scene = AppInjector.get(SceneService);
		this.prefs = AppInjector.get(PreferencesService);
		this.gameState = AppInjector.get(GameStateFacadeService);
		this.ads = AppInjector.get(ADS_SERVICE_TOKEN);
		this.allCards = AppInjector.get(CardsFacadeService);
		this.cardStats = AppInjector.get(ArenaCardStatsService);
		this.classStats = AppInjector.get(ArenaClassStatsService);

		await waitForReady(this.scene, this.prefs, this.cardStats, this.classStats, this.gameState);
		await this.ads.isReady();

		const showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(
				map(
					(prefs) =>
						MULLIGAN_GUIDE_IS_ENABLED &&
						(prefs.arenaShowMulliganDeckOverview || prefs.arenaShowMulliganCardImpact),
				),
			),
			this.gameState.gameState$$,
		]).pipe(
			debounceTime(200),
			map(([currentScene, displayFromPrefs, gameState]) => {
				const gameStarted = gameState?.gameStarted;
				const gameEnded = gameState?.gameEnded;
				const mulliganOver = gameState?.mulliganOver;

				if (!gameStarted || mulliganOver || !displayFromPrefs) {
					return false;
				}

				if (![GameType.GT_ARENA].includes(gameState.metadata.gameType)) {
					return false;
				}

				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}

				if (gameEnded) {
					return false;
				}

				return true;
			}),
			distinctUntilChanged(),
			tap((showWidget) => console.debug('[mulligan-arena-guide] showWidget', showWidget)),
			shareReplay(1),
		);

		const opponentActualClass$ = this.gameState.gameState$$.pipe(
			map((gameState) =>
				CardClass[gameState?.opponentDeck?.hero?.classes?.[0] ?? CardClass.NEUTRAL].toLowerCase(),
			),
			distinctUntilChanged(),
		);
		const opponentClass$: Observable<'all' | string> = combineLatest([
			opponentActualClass$,
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.decktrackerMulliganOpponent),
				distinctUntilChanged(),
			),
		]).pipe(
			map(([opponentActualClass, opponentPref]) => (opponentPref === 'all' ? 'all' : opponentActualClass)),
			distinctUntilChanged(),
			shareReplay(1),
		);
		opponentClass$.subscribe(async (opponentClass) => {
			const prefs = await this.prefs.getPreferences();
			const currentOpponentClassPref = prefs.decktrackerMulliganOpponent;
			if (currentOpponentClassPref !== opponentClass) {
				const newPrefs: Preferences = {
					...prefs,
					decktrackerMulliganOpponent: opponentClass,
				};
				await this.prefs.savePreferences(newPrefs);
			}
		});
		// const opponentClass$ = from(['all'] as ('all' | string)[]);

		const timeFrame$ = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.decktrackerMulliganTime),
			distinctUntilChanged(),
			shareReplay(1),
		);

		const playerClass$ = this.gameState.gameState$$.pipe(
			map((gameState) => gameState?.playerDeck.hero?.classes?.[0]),
			filter((playerClass) => !!playerClass),
			distinctUntilChanged(),
			tap((playerClass) => console.debug('[mulligan-arena-guide] playerClass', playerClass)),
		);
		const cardStats$ = combineLatest([showWidget$, playerClass$, timeFrame$]).pipe(
			filter(([showWidget, _]) => showWidget),
			switchMap(([showWidget, playerClass, timeFrame]) =>
				this.cardStats.buildCardStats(
					!!playerClass ? CardClass[playerClass].toLowerCase() : 'global',
					timeFrame,
				),
			),
			tap((stats) => console.debug('[mulligan-arena-guide] card stats', stats)),
		);
		const classStats$ = combineLatest([showWidget$, timeFrame$]).pipe(
			filter(([showWidget]) => showWidget),
			switchMap(([showWidget, timeFrame]) =>
				combineLatest([this.classStats.buildClassStats(timeFrame), playerClass$]),
			),
			map(([classStats, playerClass]) =>
				classStats?.stats?.find(
					(stat) => stat.playerClass === CardClass[playerClass ?? CardClass.INVALID].toLowerCase(),
				),
			),
			tap((stats) => console.debug('[mulligan-arena-guide] class stats', stats)),
		);

		const cardsInHand$ = showWidget$.pipe(
			filter((showWidget) => showWidget),
			debounceTime(200),
			switchMap(() => this.gameState.gameState$$),
			map((gameState) => {
				// There should never be a "basic" coin in the mulligan AFAIK
				const cardsInHand =
					gameState?.playerDeck.hand?.map((c) => c.cardId).filter((c) => !isCoin(c, this.allCards)) ?? [];
				return cardsInHand.length > 0 ? cardsInHand : null;
			}),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			tap((cardsInHand) => console.debug('[mulligan-arena-guide] cardsInHand', cardsInHand)),
			shareReplay(1),
		);
		const deckCards$ = showWidget$.pipe(
			filter((showWidget) => showWidget),
			debounceTime(200),
			switchMap(() => this.gameState.gameState$$),
			map((gameState) => {
				const deckstring = gameState?.playerDeck?.deckstring;
				if (!deckstring?.length) {
					return null;
				}

				const deckDefinition = decode(deckstring);
				const cards = deckDefinition?.cards
					?.map((card) => card[0])
					.map((dbfId) => this.allCards.getCard(dbfId));
				return cards;
			}),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			tap((cardsInHand) => console.debug('[mulligan-arena-guide] deckCards', cardsInHand)),
			shareReplay(1),
		);

		const mulliganAdvice$ = combineLatest([cardsInHand$, deckCards$]).pipe(
			filter(([cardsInHand, deckCards]) => !!cardsInHand && !!deckCards),
			debounceTime(200),
			switchMap(([cardsInHand, deckCards]) =>
				combineLatest([cardStats$, classStats$, opponentClass$]).pipe(
					map(([cardStats, classStats, opponentClass]) => ({
						cardsInHand: cardsInHand,
						deckCards: deckCards,
						cardStats: cardStats,
						classStats: classStats,
						opponentClass: opponentClass,
					})),
				),
			),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			map(({ cardsInHand, deckCards, cardStats, classStats, opponentClass }) => {
				const matchup = classStats?.matchups?.find((matchup) => matchup.opponentClass === opponentClass);
				const classWinrate = !!matchup
					? !!matchup.totalGames
						? matchup.totalsWins / matchup.totalGames
						: 0
					: !!classStats?.totalGames
					? classStats.totalsWins / classStats.totalGames
					: 0;
				const allDeckCards: readonly MulliganCardAdvice[] =
					deckCards?.map((refCard) => {
						const cardData = cardStats?.stats.find(
							(card) => getBaseCardId(card.cardId) === getBaseCardId(refCard.id),
						);
						const matchup = cardData?.matchStats?.matchups?.find(
							(matchup) => matchup.opponentClass === opponentClass,
						);
						const stats = !!matchup ? matchup.stats : cardData?.matchStats?.stats;
						const rawImpact = stats?.inHandAfterMulligan
							? stats.inHandAfterMulliganThenWin / stats.inHandAfterMulligan - classWinrate
							: null;
						const rawKeepRate = stats?.drawnBeforeMulligan
							? stats?.keptInMulligan / stats.drawnBeforeMulligan
							: null;
						const mulliganAdvice: MulliganCardAdvice = {
							cardId: refCard.id,
							score: rawImpact == null ? null : 100 * rawImpact,
							keepRate: rawKeepRate,
						};
						return mulliganAdvice;
					}) ?? [];

				const result: MulliganGuide = {
					noData: !cardStats?.stats?.length,
					cardsInHand: cardsInHand!,
					allDeckCards: allDeckCards,
					sampleSize: (!!matchup ? matchup.totalGames : classStats?.totalGames) ?? 0,
					opponentClass: opponentClass,
					format: 'wild',
					rankBracket: 'all',
					archetypeId: null,
					deckstring: null,
				};
				return result;
			}),
			tap((mulliganAdvice) => console.debug('[mulligan-arena-guide] mulliganAdvice', mulliganAdvice)),
			shareReplay(1),
		);
		combineLatest([showWidget$, mulliganAdvice$]).subscribe(([showWidget, advice]) =>
			this.mulliganAdvice$$.next(showWidget ? advice : null),
		);
	}
}
