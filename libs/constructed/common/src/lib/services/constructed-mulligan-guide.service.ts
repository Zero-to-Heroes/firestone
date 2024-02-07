/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { GameFormat, RankBracket } from '@firestone-hs/constructed-deck-stats';
import { decode } from '@firestone-hs/deckstrings';
import {
	COIN_IDS,
	CardIds,
	GameFormat as GameFormatEnum,
	GameFormatString,
	SceneMode,
} from '@firestone-hs/reference-data';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	IAdsService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { toFormatType } from '@firestone/stats/data-access';
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
import { ConstructedMetaDecksStateService } from './constructed-meta-decks-state-builder.service';
import { GameStateFacadeService } from './game-state-facade.service';

export const CARD_IN_HAND_AFTER_MULLIGAN_THRESHOLD = 20;

@Injectable()
export class ConstructedMulliganGuideService extends AbstractFacadeService<ConstructedMulliganGuideService> {
	public mulliganAdvice$$: BehaviorSubject<MulliganGuide | null>;

	private scene: SceneService;
	private prefs: PreferencesService;
	private gameState: GameStateFacadeService;
	private ads: IAdsService;
	private archetypes: ConstructedMetaDecksStateService;
	private allCards: CardsFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ConstructedMulliganGuideService', () => !!this.mulliganAdvice$$);
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
		this.archetypes = AppInjector.get(ConstructedMetaDecksStateService);
		this.allCards = AppInjector.get(CardsFacadeService);

		await Promise.all([this.scene.isReady(), this.prefs.isReady(), this.ads.isReady(), this.archetypes.isReady()]);

		const showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$((prefs) => prefs.decktrackerMulliganGuideOverlay),
			this.gameState.gameState$$,
			this.ads.hasPremiumSub$$,
		]).pipe(
			debounceTime(200),
			map(([currentScene, [displayFromPrefs], gameState, hasPremiumSub]) => {
				const gameStarted = gameState?.gameStarted;
				const gameEnded = gameState?.gameEnded;
				const mulliganOver = gameState?.mulliganOver;
				const isBgs = gameState?.isBattlegrounds();
				const isMercs = gameState?.isMercenaries();

				if (!gameStarted || mulliganOver || isBgs || isMercs || !displayFromPrefs) {
					return false;
				}

				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}

				if (gameEnded) {
					return false;
				}

				if (!hasPremiumSub) {
					return false;
				}

				return true;
			}),
			distinctUntilChanged(),
			shareReplay(1),
			tap((showWidget) => console.log('[mulligan-guide] showWidget', showWidget)),
		);

		const format$ = showWidget$.pipe(
			filter((showWidget) => showWidget),
			switchMap(() => this.gameState.gameState$$),
			map(
				(gameState) =>
					toFormatType(gameState?.metadata.formatType ?? GameFormatEnum.FT_STANDARD) as GameFormatString,
			),
		);
		const playerRank$ = from(['legend-diamond'] as RankBracket[]);
		const opponentClass$ = from(['all'] as ('all' | string)[]);

		const archetype$ = showWidget$.pipe(
			filter((showWidget) => showWidget),
			// tap((showWidget: boolean) => console.debug('[mulligan-guide] will show archetype', showWidget)),
			debounceTime(200),
			switchMap(() => combineLatest([this.gameState.gameState$$, playerRank$, opponentClass$])),
			map(([gameState, playerRank, opponentClass]) => ({
				archetypeId: gameState?.playerDeck?.archetypeId,
				format: gameState?.metadata?.formatType,
				playerRank: playerRank,
				opponentClass: opponentClass,
			})),
			filter((info) => !!info.archetypeId && !!info.format),
			distinctUntilChanged((a, b) => a.archetypeId === b.archetypeId && a.format === b.format),
			switchMap(({ archetypeId, format, playerRank, opponentClass }) =>
				this.archetypes.loadNewArchetypeDetails(
					archetypeId as number,
					toFormatType(format as any) as GameFormat,
					'last-patch',
					playerRank,
				),
			),
			shareReplay(1),
			tap((archetype) => console.log('[mulligan-guide] archetype', archetype)),
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
			shareReplay(1),
			tap((cardsInHand) => console.log('[mulligan-guide] cardsInHand', cardsInHand)),
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
			shareReplay(1),
			tap((cardsInHand) => console.log('[mulligan-guide] deckCards', cardsInHand)),
		);

		const mulliganAdvice$ = combineLatest([cardsInHand$, deckCards$]).pipe(
			filter(([cardsInHand, deckCards]) => !!cardsInHand && !!deckCards),
			debounceTime(200),
			switchMap(([cardsInHand, deckCards]) =>
				combineLatest([archetype$, format$, playerRank$, opponentClass$]).pipe(
					map(([archetype, format, playerRank, opponentClass]) => ({
						cardsInHand: cardsInHand,
						deckCards: deckCards,
						archetype: archetype,
						format: format,
						playerRank: playerRank,
						opponentClass: opponentClass,
					})),
				),
			),
			filter(({ cardsInHand, deckCards, archetype }) => !!archetype),
			map(({ cardsInHand, deckCards, archetype, format, playerRank, opponentClass }) => {
				// console.debug('[mulligan-guide] building advice', cardsInHand, archetype);
				const archetypeWinrate = archetype!.winrate;
				// const mulliganImpacts = archetype!.cardsData
				// 	.filter((card) => card.inHandAfterMulligan > CARD_IN_HAND_AFTER_MULLIGAN_THRESHOLD)
				// 	.map((card) => card.inHandAfterMulliganThenWin / card.inHandAfterMulligan - archetypeWinrate);
				// const highestMulliganWinrate = mulliganImpacts.reduce((a, b) => Math.max(a, b), 0);
				// const lowestMulliganWinrate = mulliganImpacts.reduce((a, b) => Math.min(a, b), 0);
				// console.debug(
				// 	'[mulligan-guide] mulliganImpacts',
				// 	archetypeWinrate,
				// 	highestMulliganWinrate,
				// 	lowestMulliganWinrate,
				// 	mulliganImpacts,
				// );

				const allDeckCards: readonly MulliganCardAdvice[] =
					deckCards?.map((refCard) => {
						const cardData =
							archetype!.cardsData?.find((card) => card.cardId === refCard.id) ??
							archetype!.cardsData?.find(
								(card) =>
									this.allCards.getRootCardId(card.cardId) ===
									this.allCards.getRootCardId(refCard.id),
							);
						const rawImpact = !!cardData?.inHandAfterMulligan
							? cardData.inHandAfterMulliganThenWin / cardData?.inHandAfterMulligan - archetypeWinrate
							: null;
						const mulliganAdvice: MulliganCardAdvice = {
							cardId: refCard.id,
							score: rawImpact == null ? null : 100 * rawImpact,
						};
						// console.debug(
						// 	'[mulligan-guide] mulliganAdvice',
						// 	refCard.id,
						// 	cardData,
						// 	archetypeWinrate,
						// 	rawImpact,
						// );
						return mulliganAdvice;
					}) ?? [];

				const result: MulliganGuide = {
					cardsInHand: cardsInHand!,
					allDeckCards: allDeckCards,
					sampleSize: archetype!.totalGames,
					rankBracket: playerRank,
					opponentClass: opponentClass,
					format: format,
				};
				return result;
			}),
			shareReplay(1),
			tap((mulliganAdvice) => console.log('[mulligan-guide] mulliganAdvice', mulliganAdvice)),
		);
		combineLatest([showWidget$, mulliganAdvice$]).subscribe(([showWidget, advice]) =>
			this.mulliganAdvice$$.next(showWidget ? advice : null),
		);
	}
}
