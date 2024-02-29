/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { ArchetypeStat, GameFormat, RankBracket } from '@firestone-hs/constructed-deck-stats';
import { decode } from '@firestone-hs/deckstrings';
import {
	COIN_IDS,
	CardIds,
	GameFormat as GameFormatEnum,
	GameFormatString,
	GameType,
	SceneMode,
} from '@firestone-hs/reference-data';
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
} from '@firestone/shared/framework/core';
import { toFormatType } from '@firestone/stats/data-access';
import {
	BehaviorSubject,
	Observable,
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
import { MULLIGAN_GUIDE_IS_ENABLED } from './constructed-mulligan-guide-guardian.service';
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
			this.prefs.preferences$(
				(prefs) =>
					MULLIGAN_GUIDE_IS_ENABLED &&
					(prefs.decktrackerShowMulliganDeckOverview || prefs.decktrackerShowMulliganCardImpact),
			),
			this.gameState.gameState$$,
			// canShowWidget$,
		]).pipe(
			debounceTime(200),
			map(([currentScene, [displayFromPrefs], gameState]) => {
				const gameStarted = gameState?.gameStarted;
				const gameEnded = gameState?.gameEnded;
				const mulliganOver = gameState?.mulliganOver;

				if (!gameStarted || mulliganOver || !displayFromPrefs) {
					return false;
				}

				if (
					![GameType.GT_RANKED, GameType.GT_CASUAL, GameType.GT_VS_FRIEND].includes(
						gameState.metadata.gameType,
					)
				) {
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
			tap((showWidget) => console.debug('[mulligan-guide] showWidget', showWidget)),
			shareReplay(1),
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

		const archetype$: Observable<ArchetypeStat | null> = showWidget$.pipe(
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
			filter((info) => !!info.format),
			distinctUntilChanged(
				(a, b) =>
					a.archetypeId === b.archetypeId &&
					a.format === b.format &&
					a.playerRank === b.playerRank &&
					a.opponentClass === b.opponentClass,
			),
			switchMap(({ archetypeId, format, playerRank, opponentClass }) => {
				const result = this.archetypes.loadNewArchetypeDetails(
					archetypeId as number,
					toFormatType(format as any) as GameFormat,
					'last-patch',
					playerRank,
				);
				// console.debug('[mulligan-guide] archetype result', result);
				return result;
			}),
			// filter((archetype) => !!archetype),
			// map(archetype => archetype as ArchetypeStat),
			tap((archetype) => console.debug('[mulligan-guide] archetype', archetype)),
			// shareReplay(1),
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
			tap((cardsInHand) => console.debug('[mulligan-guide] cardsInHand', cardsInHand)),
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
			tap((cardsInHand) => console.debug('[mulligan-guide] deckCards', cardsInHand)),
			shareReplay(1),
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
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			map(({ cardsInHand, deckCards, archetype, format, playerRank, opponentClass }) => {
				const archetypeWinrate = archetype?.winrate ?? 0;
				const allDeckCards: readonly MulliganCardAdvice[] =
					deckCards?.map((refCard) => {
						const cardData =
							archetype?.cardsData?.find((card) => card.cardId === refCard.id) ??
							archetype?.cardsData?.find(
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
						return mulliganAdvice;
					}) ?? [];

				const result: MulliganGuide = {
					noData: !archetype,
					cardsInHand: cardsInHand!,
					allDeckCards: allDeckCards,
					sampleSize: archetype?.totalGames ?? 0,
					rankBracket: playerRank,
					opponentClass: opponentClass,
					format: format,
				};
				return result;
			}),
			tap((mulliganAdvice) => console.debug('[mulligan-guide] mulliganAdvice', mulliganAdvice)),
			shareReplay(1),
		);
		combineLatest([showWidget$, mulliganAdvice$]).subscribe(([showWidget, advice]) =>
			this.mulliganAdvice$$.next(showWidget ? advice : null),
		);
	}
}
