/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { decode } from '@firestone-hs/deckstrings';
import { COIN_IDS, CardClass, CardIds, GameType, SceneMode, getBaseCardId } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/constructed/common';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
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
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	from,
	map,
	shareReplay,
	switchMap,
	tap,
} from 'rxjs';
import { MulliganCardAdvice, MulliganGuide } from '../models/mulligan-advice';
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

		const opponentClass$ = from(['all'] as ('all' | string)[]);
		const playerClass$ = this.gameState.gameState$$.pipe(
			map((gameState) => gameState?.playerDeck.hero?.classes?.[0]),
			filter((playerClass) => !!playerClass),
			distinctUntilChanged(),
			tap((playerClass) => console.debug('[mulligan-arena-guide] playerClass', playerClass)),
		);
		const cardStats$ = combineLatest([showWidget$, playerClass$]).pipe(
			filter(([showWidget, _]) => showWidget),
			switchMap(([showWidget, playerClass]) =>
				this.cardStats.buildCardStats(
					!!playerClass ? CardClass[playerClass].toLowerCase() : 'global',
					'last-patch',
				),
			),
			tap((stats) => console.debug('[mulligan-arena-guide] card stats', stats)),
		);
		const classStats$ = combineLatest([showWidget$]).pipe(
			filter(([showWidget]) => showWidget),
			switchMap(([showWidget]) => combineLatest([this.classStats.buildClassStats('last-patch'), playerClass$])),
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
					gameState?.playerDeck.hand?.map((c) => c.cardId).filter((c) => !COIN_IDS.includes(c as CardIds)) ??
					[];
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
				const classWinrate = !!classStats?.totalGames ? classStats.totalsWins / classStats.totalGames : 0;
				const allDeckCards: readonly MulliganCardAdvice[] =
					deckCards?.map((refCard) => {
						const cardData = cardStats?.stats.find(
							(card) => getBaseCardId(card.cardId) === getBaseCardId(refCard.id),
						);
						const rawImpact = !!cardData?.matchStats?.inHandAfterMulligan
							? cardData.matchStats.inHandAfterMulliganThenWin / cardData.matchStats.inHandAfterMulligan -
							  classWinrate
							: null;
						const rawKeepRate = !!cardData?.matchStats?.inHandAfterMulligan
							? cardData?.matchStats?.keptInMulligan / cardData.matchStats.inHandAfterMulligan
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
					sampleSize: classStats?.totalGames ?? 0,
					opponentClass: opponentClass,
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
