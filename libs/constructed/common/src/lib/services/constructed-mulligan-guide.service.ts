/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { ArchetypeStat, DeckStat, GameFormat, RankBracket } from '@firestone-hs/constructed-deck-stats';
import { decode } from '@firestone-hs/deckstrings';
import {
	CardClass,
	GameFormat as GameFormatEnum,
	GameFormatString,
	GameType,
	SceneMode,
	getBaseCardId,
	isCoin,
} from '@firestone-hs/reference-data';
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
import { toFormatType } from '@firestone/stats/data-access';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	of,
	shareReplay,
	switchMap,
	tap,
} from 'rxjs';
import { MulliganCardAdvice, MulliganGuide } from '../models/mulligan-advice';
import { ConstructedArchetypeService } from './constructed-archetype.service';
import { ConstructedMetaDecksStateService } from './constructed-meta-decks-state-builder.service';
import { MULLIGAN_GUIDE_IS_ENABLED } from './constructed-mulligan-guide-guardian.service';

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
	private archetypeService: ConstructedArchetypeService;

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
		this.archetypeService = AppInjector.get(ConstructedArchetypeService);

		await waitForReady(this.scene, this.prefs, this.archetypes, this.gameState);
		await this.ads.isReady();

		const showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(
				map(
					(prefs) =>
						MULLIGAN_GUIDE_IS_ENABLED &&
						(prefs.decktrackerShowMulliganDeckOverview || prefs.decktrackerShowMulliganCardImpact),
				),
			),
			this.gameState.gameState$$,
			// canShowWidget$,
		]).pipe(
			debounceTime(200),
			map(([currentScene, displayFromPrefs, gameState]) => {
				// return true;
				const gameStarted = gameState?.gameStarted;
				const gameEnded = gameState?.gameEnded;
				const mulliganOver = gameState?.mulliganOver;

				if (!gameStarted || mulliganOver || !displayFromPrefs) {
					return false;
				}

				if (
					![GameType.GT_RANKED, GameType.GT_CASUAL, GameType.GT_VS_FRIEND, GameType.GT_VS_AI].includes(
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
			// tap((showWidget) => console.debug('[mulligan-guide] showWidget', showWidget)),
			shareReplay(1),
		);

		this.scene.currentScene$$
			.pipe(
				distinctUntilChanged(),
				filter((scene) => scene === SceneMode.GAMEPLAY),
			)
			.subscribe(async () => {
				const prefs = await this.prefs.getPreferences();
				const newPrefs: Preferences = {
					...prefs,
					decktrackerMulliganFormatOverride: null,
				};
				await this.prefs.savePreferences(newPrefs);
			});

		const formatOverride$ = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.decktrackerMulliganFormatOverride),
			distinctUntilChanged(),
		);
		const format$ = showWidget$.pipe(
			filter((showWidget) => showWidget),
			switchMap(() => combineLatest([this.gameState.gameState$$, formatOverride$])),
			map(
				([gameState, formatOverride]) =>
					formatOverride ?? gameState?.metadata.formatType ?? GameFormatEnum.FT_STANDARD,
			),
			distinctUntilChanged(),
			shareReplay(1),
		);
		const gameType$ = showWidget$.pipe(
			filter((showWidget) => showWidget),
			switchMap(() => this.gameState.gameState$$),
			map((gameState) => gameState?.metadata.gameType),
			distinctUntilChanged(),
			shareReplay(1),
		);
		const playerRank$: Observable<RankBracket> = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.decktrackerMulliganRankBracket),
			distinctUntilChanged(),
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

		const timeFrame$ = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.decktrackerMulliganTime),
			distinctUntilChanged(),
			shareReplay(1),
		);

		const archetypeId$ = combineLatest([
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.constructedDeckArchetypeOverrides),
				distinctUntilChanged(),
			),
			this.gameState.gameState$$.pipe(
				map((state) => ({
					deckstring: state?.playerDeck.deckstring,
					archetypeId: state?.playerDeck.archetypeId,
				})),
				distinctUntilChanged(),
			),
		]).pipe(
			map(
				([overrides, { deckstring, archetypeId }]) =>
					(!!deckstring ? overrides[deckstring] : null) ?? archetypeId,
			),
			distinctUntilChanged(),
		);

		const archetype$: Observable<ArchetypeStat | null> = combineLatest([showWidget$, format$, timeFrame$]).pipe(
			filter(([showWidget, format, timeFrame]) => showWidget),
			// tap((showWidget: boolean) => console.debug('[mulligan-guide] will show archetype', showWidget)),
			debounceTime(200),
			switchMap(([showWidget, format, timeFrame]) =>
				combineLatest([archetypeId$, playerRank$, opponentClass$, of(format), of(timeFrame)]),
			),
			map(([archetypeId, playerRank, opponentClass, format, timeFrame]) => ({
				archetypeId: archetypeId,
				format: format,
				playerRank: playerRank,
				opponentClass: opponentClass,
				timeFrame: timeFrame,
			})),
			filter((info) => !!info.format),
			distinctUntilChanged(
				(a, b) =>
					a.archetypeId === b.archetypeId &&
					a.format === b.format &&
					a.playerRank === b.playerRank &&
					a.timeFrame === b.timeFrame &&
					a.opponentClass === b.opponentClass,
			),
			switchMap(({ archetypeId, format, playerRank, opponentClass, timeFrame }) => {
				const result = this.archetypes.loadNewArchetypeDetails(
					archetypeId as number,
					toFormatType(format as any) as GameFormat,
					timeFrame,
					playerRank,
				);
				// console.debug('[mulligan-guide] archetype result', result);
				return result;
			}),
			// filter((archetype) => !!archetype),
			// map(archetype => archetype as ArchetypeStat),
			// tap((archetype) => console.debug('[mulligan-guide] archetype', archetype)),
			// shareReplay(1),
		);
		const deckDetails$: Observable<DeckStat | null> = combineLatest([showWidget$, format$, timeFrame$]).pipe(
			filter(([showWidget, format, timeFrame]) => showWidget),
			// tap((showWidget: boolean) => console.debug('[mulligan-guide] will show archetype', showWidget)),
			debounceTime(200),
			switchMap(([showWidget, format, timeFrame]) =>
				combineLatest([this.gameState.gameState$$, playerRank$, opponentClass$, of(format), of(timeFrame)]),
			),
			map(([gameState, playerRank, opponentClass, format, timeFrame]) => ({
				deckString: this.allCards.normalizeDeckList(gameState?.playerDeck?.deckstring),
				format: format,
				playerRank: playerRank,
				opponentClass: opponentClass,
				timeFrame: timeFrame,
			})),
			filter((info) => !!info.format),
			distinctUntilChanged(
				(a, b) =>
					a.deckString === b.deckString &&
					a.format === b.format &&
					a.playerRank === b.playerRank &&
					a.timeFrame === b.timeFrame &&
					a.opponentClass === b.opponentClass,
			),
			switchMap(({ deckString, format, playerRank, opponentClass, timeFrame }) => {
				const result = this.archetypes.loadNewDeckDetails(
					deckString,
					toFormatType(format as any) as GameFormat,
					timeFrame,
					playerRank,
				);
				// console.debug('[mulligan-guide] archetype result', result);
				return result;
			}),
			// filter((archetype) => !!archetype),
			// map(archetype => archetype as ArchetypeStat),
			// tap((deckDetails) => console.debug('[mulligan-guide] deck stat', deckDetails)),
			// shareReplay(1),
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
				combineLatest([
					archetype$,
					deckDetails$,
					format$,
					gameType$,
					playerRank$,
					opponentClass$,
					this.gameState.gameState$$.pipe(map((state) => state?.playerDeck.deckstring)),
				]).pipe(
					map(([archetype, deckDetails, format, gameType, playerRank, opponentClass, deckstring]) => ({
						cardsInHand: cardsInHand,
						deckCards: deckCards,
						archetype: archetype,
						deckDetails: deckDetails,
						format: format,
						gameType: gameType,
						playerRank: playerRank,
						opponentClass: opponentClass,
						deckstring: deckstring,
					})),
				),
			),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			map(
				({
					cardsInHand,
					deckCards,
					archetype,
					deckDetails,
					format,
					gameType,
					playerRank,
					opponentClass,
					deckstring,
				}) => {
					const archetypeMatchup =
						opponentClass === 'all'
							? null
							: archetype?.matchupInfo.find((info) => info.opponentClass === opponentClass);
					const deckMatchup =
						opponentClass === 'all'
							? null
							: deckDetails?.matchupInfo.find((info) => info.opponentClass === opponentClass);
					const archetypeWinrate =
						opponentClass === 'all'
							? archetype?.winrate ?? deckDetails?.winrate ?? 0
							: archetypeMatchup?.winrate ?? deckMatchup?.winrate ?? 0;
					const cardsData =
						opponentClass === 'all'
							? archetype?.cardsData ?? deckDetails?.cardsData ?? []
							: archetypeMatchup?.cardsData ?? deckMatchup?.cardsData ?? [];
					const sampleSize =
						opponentClass === 'all'
							? archetype?.totalGames ?? deckDetails?.totalGames ?? 0
							: archetypeMatchup?.totalGames ?? deckMatchup?.totalGames ?? 0;
					const allDeckCards: readonly MulliganCardAdvice[] =
						deckCards?.map((refCard) => {
							const cardData =
								cardsData.find((card) => getBaseCardId(card.cardId) === getBaseCardId(refCard.id)) ??
								cardsData.find(
									(card) =>
										this.allCards.getRootCardId(getBaseCardId(card.cardId)) ===
										this.allCards.getRootCardId(getBaseCardId(refCard.id)),
								);
							const rawImpact = !!cardData?.inHandAfterMulligan
								? cardData.inHandAfterMulliganThenWin / cardData?.inHandAfterMulligan - archetypeWinrate
								: null;
							const rawKeepRate = !!cardData?.drawnBeforeMulligan
								? cardData?.keptInMulligan / cardData.drawnBeforeMulligan
								: null;
							const mulliganAdvice: MulliganCardAdvice = {
								cardId: refCard.id,
								score: rawImpact == null ? null : 100 * rawImpact,
								keepRate: rawKeepRate,
							};
							return mulliganAdvice;
						}) ?? [];

					const result: MulliganGuide = {
						noData: !cardsData.length,
						againstAi: gameType === GameType.GT_VS_AI,
						cardsInHand: cardsInHand!,
						allDeckCards: allDeckCards,
						sampleSize: sampleSize,
						rankBracket: playerRank,
						opponentClass: opponentClass,
						format: toFormatType(format) as GameFormatString,
						archetypeId: archetype?.id ?? null,
						deckstring: deckstring ?? null,
					};
					return result;
				},
			),
			tap((mulliganAdvice) => console.debug('[mulligan-guide] mulliganAdvice', mulliganAdvice)),
			shareReplay(1),
		);
		combineLatest([showWidget$, mulliganAdvice$]).subscribe(([showWidget, advice]) =>
			this.mulliganAdvice$$.next(showWidget ? advice : null),
		);
	}

	public getMulliganAdvice$(deckstring: string): Observable<MulliganGuide | null> {
		return this.mainInstance.getMulliganAdviceInternal$(deckstring);
	}

	private getMulliganAdviceInternal$(deckstring: string): Observable<MulliganGuide | null> {
		// TODO: use current format of the lobby screen
		const formatOverride$ = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.decktrackerMulliganFormatOverride ?? GameFormatEnum.FT_STANDARD),
			distinctUntilChanged(),
		);
		const playerRank$: Observable<RankBracket> = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.decktrackerMulliganRankBracket),
			distinctUntilChanged(),
		);
		const opponentClass$: Observable<'all' | string> = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.decktrackerOocMulliganOpponent),
			distinctUntilChanged(),
		);
		const timeFrame$ = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.decktrackerMulliganTime),
			distinctUntilChanged(),
			shareReplay(1),
		);
		const archetypeId$ = combineLatest([
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.constructedDeckArchetypeOverrides),
				distinctUntilChanged(),
			),
			this.archetypeService.getArchetypeForDeck(deckstring),
		]).pipe(
			map(([overrides, archetypeId]) => (!!deckstring ? overrides[deckstring] : null) ?? archetypeId),
			distinctUntilChanged(),
		);
		const archetype$: Observable<ArchetypeStat | null> = combineLatest([formatOverride$, timeFrame$]).pipe(
			debounceTime(200),
			switchMap(([format, timeFrame]) =>
				combineLatest([archetypeId$, playerRank$, opponentClass$, of(format), of(timeFrame)]),
			),
			map(([archetypeId, playerRank, opponentClass, format, timeFrame]) => ({
				archetypeId: archetypeId,
				format: format,
				playerRank: playerRank,
				opponentClass: opponentClass,
				timeFrame: timeFrame,
			})),
			filter((info) => !!info.format),
			distinctUntilChanged(
				(a, b) =>
					a.archetypeId === b.archetypeId &&
					a.format === b.format &&
					a.playerRank === b.playerRank &&
					a.timeFrame === b.timeFrame &&
					a.opponentClass === b.opponentClass,
			),
			switchMap(({ archetypeId, format, playerRank, opponentClass, timeFrame }) => {
				const result = this.archetypes.loadNewArchetypeDetails(
					archetypeId as number,
					toFormatType(format as any) as GameFormat,
					timeFrame,
					playerRank,
				);
				return result;
			}),
		);
		const deckDetails$: Observable<DeckStat | null> = combineLatest([formatOverride$, timeFrame$]).pipe(
			debounceTime(200),
			switchMap(([format, timeFrame]) =>
				combineLatest([this.gameState.gameState$$, playerRank$, opponentClass$, of(format), of(timeFrame)]),
			),
			map(([gameState, playerRank, opponentClass, format, timeFrame]) => ({
				deckString: this.allCards.normalizeDeckList(gameState?.playerDeck?.deckstring),
				format: format,
				playerRank: playerRank,
				opponentClass: opponentClass,
				timeFrame: timeFrame,
			})),
			filter((info) => !!info.format),
			distinctUntilChanged(
				(a, b) =>
					a.deckString === b.deckString &&
					a.format === b.format &&
					a.playerRank === b.playerRank &&
					a.timeFrame === b.timeFrame &&
					a.opponentClass === b.opponentClass,
			),
			switchMap(({ deckString, format, playerRank, opponentClass, timeFrame }) => {
				const result = this.archetypes.loadNewDeckDetails(
					deckString,
					toFormatType(format as any) as GameFormat,
					timeFrame,
					playerRank,
				);
				return result;
			}),
		);
		const deckCards = decode(deckstring)
			?.cards?.map((card) => card[0])
			.map((dbfId) => this.allCards.getCard(dbfId));
		const mulliganAdvice$ = combineLatest([
			archetype$,
			deckDetails$,
			formatOverride$,
			playerRank$,
			opponentClass$,
		]).pipe(
			map(([archetype, deckDetails, format, playerRank, opponentClass]) => {
				const archetypeMatchup =
					opponentClass === 'all'
						? null
						: archetype?.matchupInfo.find((info) => info.opponentClass === opponentClass);
				const deckMatchup =
					opponentClass === 'all'
						? null
						: deckDetails?.matchupInfo.find((info) => info.opponentClass === opponentClass);
				const archetypeWinrate =
					opponentClass === 'all'
						? archetype?.winrate ?? deckDetails?.winrate ?? 0
						: archetypeMatchup?.winrate ?? deckMatchup?.winrate ?? 0;
				const cardsData =
					opponentClass === 'all'
						? archetype?.cardsData ?? deckDetails?.cardsData ?? []
						: archetypeMatchup?.cardsData ?? deckMatchup?.cardsData ?? [];
				const sampleSize =
					opponentClass === 'all'
						? archetype?.totalGames ?? deckDetails?.totalGames ?? 0
						: archetypeMatchup?.totalGames ?? deckMatchup?.totalGames ?? 0;
				const allDeckCards: readonly MulliganCardAdvice[] =
					deckCards?.map((refCard) => {
						const cardData =
							cardsData.find((card) => getBaseCardId(card.cardId) === getBaseCardId(refCard.id)) ??
							cardsData.find(
								(card) =>
									this.allCards.getRootCardId(getBaseCardId(card.cardId)) ===
									this.allCards.getRootCardId(getBaseCardId(refCard.id)),
							);
						const rawImpact = !!cardData?.inHandAfterMulligan
							? cardData.inHandAfterMulliganThenWin / cardData?.inHandAfterMulligan - archetypeWinrate
							: null;
						const rawKeepRate = !!cardData?.drawnBeforeMulligan
							? cardData?.keptInMulligan / cardData.drawnBeforeMulligan
							: null;
						const mulliganAdvice: MulliganCardAdvice = {
							cardId: refCard.id,
							score: rawImpact == null ? null : 100 * rawImpact,
							keepRate: rawKeepRate,
						};
						return mulliganAdvice;
					}) ?? [];

				const result: MulliganGuide = {
					noData: !cardsData.length,
					againstAi: false,
					cardsInHand: [],
					allDeckCards: allDeckCards,
					sampleSize: sampleSize,
					rankBracket: playerRank,
					opponentClass: opponentClass,
					format: toFormatType(format) as GameFormatString,
					archetypeId: archetype?.id ?? null,
					deckstring: deckstring ?? null,
				};
				return result;
			}),
			tap((mulliganAdvice) => console.debug('[mulligan-guide] mulliganAdvice', mulliganAdvice)),
			shareReplay(1),
		);
		return mulliganAdvice$;
	}
}
