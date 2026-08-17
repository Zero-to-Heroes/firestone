/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import {
	ArchetypeStat,
	ConstructedMatchupInfo,
	DeckStat,
	GameFormat,
	RankBracket,
} from '@firestone-hs/constructed-deck-stats';
import { decode } from '@firestone-hs/deckstrings';
import {
	CardClass,
	GameFormat as GameFormatEnum,
	GameFormatString,
	GameType,
	PRACTICE_ALL,
	SceneMode,
	getBaseCardId,
	isCoin,
} from '@firestone-hs/reference-data';
import { CardAnalysis } from '@firestone-hs/replay-metadata';
import { ConstructedArchetypeService, GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PatchInfo, PatchesConfigService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	CardsFacadeService,
	IAdsService,
	IUserService,
	USER_SERVICE_TOKEN,
	WindowManagerService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { GameStat, GameStatsLoaderService, toFormatType } from '@firestone/stats/data-access';
import {
	BehaviorSubject,
	Observable,
	auditTime,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	from,
	map,
	of,
	shareReplay,
	startWith,
	switchMap,
	tap,
	timer,
} from 'rxjs';
import {
	MulliganCardAdvice,
	MulliganGuide,
	MulliganPersonalMinGames,
	MulliganStatsSource,
} from '../models/mulligan-advice';
import { ConstructedMetaDecksStateService } from './constructed-meta-decks-state-builder.service';
import { MULLIGAN_GUIDE_IS_ENABLED } from './constructed-mulligan-guide-guardian.service';
import {
	AggregatedCardMulliganData,
	aggregatePersonalCardMulliganData,
	buildMulliganCardAdvice,
	chunkReviewIds,
	filterRelevantPlayerDeckMatches,
	isSamePlayerDecklist,
	meetsPersonalMinGames,
	mergeCommunityAndPersonalAdvice,
} from './constructed-personal-mulligan-stats';

export const CARD_IN_HAND_AFTER_MULLIGAN_THRESHOLD = 20;
/** Deploy public-lambdas/api-retrieve-cards-analysis and replace with the Function URL. */
const CARDS_ANALYSIS_LOOKUP_URL = 'https://xhglyhkyqwk2ipq7f3vle562ky0elprm.lambda-url.us-west-2.on.aws/';
const CARDS_ANALYSIS_LOOKUP_BATCH_SIZE = 250;

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
	private gameStats: GameStatsLoaderService;
	private patches: PatchesConfigService;
	private api: ApiRunner;
	private user: IUserService;
	private mulliganDismissed$$: BehaviorSubject<boolean>;
	private fetchingReviewIds = new Set<string>();

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
		this.gameStats = AppInjector.get(GameStatsLoaderService);
		this.patches = AppInjector.get(PatchesConfigService);
		this.api = AppInjector.get(ApiRunner);
		this.user = AppInjector.get(USER_SERVICE_TOKEN);
		this.mulliganDismissed$$ = new BehaviorSubject<boolean>(false);

		await waitForReady(this.scene, this.prefs, this.archetypes, this.gameState, this.gameStats, this.patches);
		await this.ads.isReady();

		const lingerPref$ = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.decktrackerMulliganLinger ?? 'off'),
			distinctUntilChanged(),
		);
		const mulliganOver$ = this.gameState.gameState$$.pipe(
			map((gameState) => !!gameState?.mulliganOver),
			distinctUntilChanged(),
		);
		this.gameState.gameState$$
			.pipe(
				map((gameState) => !!gameState?.gameStarted && !gameState?.mulliganOver),
				distinctUntilChanged(),
			)
			.subscribe((inMulligan) => {
				if (inMulligan) {
					this.mulliganDismissed$$.next(false);
				}
			});
		const lingerExpired$ = combineLatest([mulliganOver$, lingerPref$]).pipe(
			switchMap(([mulliganOver, linger]) => {
				if (!mulliganOver || (linger !== '5' && linger !== '10')) {
					return of(false);
				}
				return timer(Number(linger) * 1000).pipe(
					map(() => true),
					startWith(false),
				);
			}),
		);

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
			lingerPref$,
			this.mulliganDismissed$$,
			lingerExpired$,
			// canShowWidget$,
		]).pipe(
			debounceTime(200),
			map(([currentScene, displayFromPrefs, gameState, linger, dismissed, lingerExpired]) => {
				// return true;
				const gameStarted = gameState?.gameStarted;
				const gameEnded = gameState?.gameEnded;
				const mulliganOver = gameState?.mulliganOver;
				// console.debug(
				// 	'[mulligan-guide] showWidget',
				// 	currentScene,
				// 	displayFromPrefs,
				// 	gameStarted,
				// 	gameEnded,
				// 	mulliganOver,
				// );

				if (!gameStarted || !displayFromPrefs) {
					return false;
				}

				if (
					![GameType.GT_RANKED, GameType.GT_CASUAL, GameType.GT_VS_FRIEND, GameType.GT_VS_AI].includes(
						gameState.metadata.gameType,
					)
				) {
					// Brawliseum Standard should show the mulligan guide
					const isHeroicBrawliseumStandard =
						gameState.metadata.gameType === GameType.GT_TAVERNBRAWL &&
						gameState.metadata.scenarioId === 2109;
					if (!isHeroicBrawliseumStandard) {
						return false;
					}
				}

				if (
					gameState.metadata.gameType === GameType.GT_VS_AI &&
					!PRACTICE_ALL.includes(gameState.metadata.scenarioId)
				) {
					return false;
				}

				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}

				if (gameEnded) {
					return false;
				}

				if (!mulliganOver) {
					return true;
				}

				if (dismissed || linger === 'off' || lingerExpired) {
					return false;
				}

				return true;
			}),
			distinctUntilChanged(),
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
			debounceTime(500),
			map((prefs) => prefs.decktrackerMulliganFormatOverride),
			startWith(null),
			distinctUntilChanged(),
		);
		const format$ = showWidget$.pipe(
			switchMap(
				(showWidget) =>
					showWidget
						? combineLatest([this.gameState.gameState$$, formatOverride$]).pipe(
								debounceTime(500),
								map(
									([gameState, formatOverride]) =>
										formatOverride ?? gameState?.metadata.formatType ?? GameFormatEnum.FT_STANDARD,
								),
								distinctUntilChanged(),
							)
						: of(null), // Emit null or a default value when showWidget is false
			),
			shareReplay(1),
		);
		const playCoinOverride$ = this.prefs.preferences$$.pipe(
			debounceTime(500),
			map((prefs) => prefs.decktrackerMulliganPlayCoinOverride),
			distinctUntilChanged(),
		);
		const playCoin$ = showWidget$.pipe(
			switchMap(
				(showWidget) =>
					showWidget
						? combineLatest([this.gameState.gameState$$, playCoinOverride$]).pipe(
								debounceTime(500),
								map(
									([gameState, playCoinOverride]) =>
										playCoinOverride ?? (gameState.playerDeck.hand?.length > 4 ? 'coin' : 'play'),
								),
								distinctUntilChanged(),
							)
						: of(null), // Emit null or a default value when showWidget is false
			),
			shareReplay(1),
		);
		const gameType$ = showWidget$.pipe(
			switchMap(
				(showWidget) =>
					showWidget
						? this.gameState.gameState$$.pipe(
								debounceTime(500),
								map((gameState) => gameState?.metadata.gameType),
								distinctUntilChanged(),
							)
						: of(null), // Emit null or a default value when showWidget is false
			),
			shareReplay(1),
		);
		const playerRank$: Observable<RankBracket> = this.prefs.preferences$$.pipe(
			debounceTime(500),
			map((prefs) => prefs.decktrackerMulliganRankBracket),
			distinctUntilChanged(),
		);
		const opponentActualClass$ = this.gameState.gameState$$.pipe(
			debounceTime(500),
			map(
				(gameState) =>
					CardClass[gameState?.opponentDeck?.hero?.classes?.[0] ?? CardClass.NEUTRAL]?.toLowerCase() ??
					'neutral',
			),
			distinctUntilChanged(),
		);
		const opponentClass$: Observable<'all' | string> = combineLatest([
			opponentActualClass$,
			this.prefs.preferences$$.pipe(
				debounceTime(500),
				map((prefs) => prefs.decktrackerMulliganOpponent),
				distinctUntilChanged(),
			),
		]).pipe(
			map(([opponentActualClass, opponentPref]) => (opponentPref === 'all' ? 'all' : opponentActualClass)),
			distinctUntilChanged(),
			shareReplay(1),
		);
		opponentClass$.pipe(debounceTime(500)).subscribe(async (opponentClass) => {
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
			debounceTime(500),
			distinctUntilChanged(),
			shareReplay(1),
		);

		const archetypeId$ = combineLatest([
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.constructedDeckArchetypeOverrides),
				debounceTime(500),
				distinctUntilChanged(),
			),
			this.gameState.gameState$$.pipe(
				debounceTime(500),
				map((state) => ({
					deckstring: state?.playerDeck.deckstring,
					archetypeId: state?.playerDeck.archetypeId,
				})),
				tap((info) => console.debug('[mulligan-guide] archetypeId$', info)),
				distinctUntilChanged((a, b) => a?.deckstring === b?.deckstring && a?.archetypeId === b?.archetypeId),
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
			debounceTime(200),
			switchMap(([showWidget, format, timeFrame]) =>
				combineLatest([archetypeId$, playerRank$, of(format), of(timeFrame)]),
			),
			map(([archetypeId, playerRank, format, timeFrame]) => ({
				archetypeId: archetypeId,
				format: format,
				playerRank: playerRank,
				timeFrame: timeFrame,
			})),
			filter((info) => !!info.format),
			distinctUntilChanged(
				(a, b) =>
					a.archetypeId === b.archetypeId &&
					a.format === b.format &&
					a.playerRank === b.playerRank &&
					a.timeFrame === b.timeFrame,
			),
			switchMap(({ archetypeId, format, playerRank, timeFrame }) => {
				if (!this.archetypes) {
					console.warn('[mulligan-guide] archetypes service is undefined');
					return of(null);
				}

				const result = this.archetypes.loadNewArchetypeDetails(
					archetypeId as number,
					toFormatType(format as any) as GameFormat,
					timeFrame,
					playerRank,
				);

				if (!result) {
					console.warn(
						'[mulligan-guide] loadNewArchetypeDetails returned undefined',
						archetypeId,
						format,
						timeFrame,
						playerRank,
					);
					return of(null);
				}

				return from(result).pipe(
					tap((archetype) => console.debug('[mulligan-guide] archetype result', archetype)),
					tap((archetype) => {
						if (archetype === undefined) {
							console.warn(
								'[mulligan-guide] loadNewArchetypeDetails promise resolved to undefined',
								archetypeId,
								format,
							);
						}
					}),
					map((archetype) => archetype ?? null),
				);
			}),
		);

		const deckDetails$ = combineLatest([showWidget$, format$, timeFrame$]).pipe(
			filter(([showWidget, format, timeFrame]) => showWidget),
			// tap((showWidget: boolean) => console.debug('[mulligan-guide] will show archetype', showWidget)),
			switchMap(([showWidget, format, timeFrame]) =>
				combineLatest([this.gameState.gameState$$, playerRank$, of(format), of(timeFrame)]),
			),
			auditTime(500),
			map(([gameState, playerRank, format, timeFrame]) => ({
				deckString: this.allCards.normalizeDeckList(gameState?.playerDeck?.deckstring),
				format: format,
				playerRank: playerRank,
				timeFrame: timeFrame,
			})),
			filter((info) => !!info.format),
			distinctUntilChanged(
				(a, b) =>
					a.deckString === b.deckString &&
					a.format === b.format &&
					a.playerRank === b.playerRank &&
					a.timeFrame === b.timeFrame,
			),
			switchMap(({ deckString, format, playerRank, timeFrame }) => {
				if (!this.archetypes) {
					console.warn('[mulligan-guide] archetypes service is undefined');
					return of(null);
				}

				const result = this.archetypes.loadNewDeckDetailsInternal(
					deckString,
					toFormatType(format as any) as GameFormat,
					timeFrame,
					playerRank,
				);

				if (!result) {
					console.warn(
						'[mulligan-guide] loadNewDeckDetails returned undefined',
						deckString,
						format,
						timeFrame,
						playerRank,
					);
					return of(null);
				}

				return from(result).pipe(
					tap((deckDetails) => console.debug('[mulligan-guide] deckDetails result', deckDetails)),
					tap((deckDetails) => {
						if (deckDetails === undefined) {
							console.warn(
								'[mulligan-guide] loadNewDeckDetails promise resolved to undefined',
								deckString,
								format,
							);
						}
					}),
					map((deckDetails) => deckDetails ?? null),
				);
			}),
		);

		const cardsInHand$ = showWidget$.pipe(
			switchMap(
				(showWidget) =>
					showWidget
						? this.gameState.gameState$$.pipe(
								auditTime(500),
								map((gameState) => {
									// There should never be a "basic" coin in the mulligan AFAIK
									const cardsInHand =
										gameState?.playerDeck.hand
											?.map((c) => c.cardId)
											.filter((c) => !isCoin(c, this.allCards)) ?? [];
									// console.log(
									// 	'[mulligan-guide] cardsInHand 1',
									// 	cardsInHand,
									// 	gameState?.playerDeck.hand,
									// );
									return cardsInHand.length > 0 ? cardsInHand : null;
								}),
								distinctUntilChanged((a, b) => arraysEqual(a, b)),
							)
						: of(null), // Emit null or a default value when showWidget is false
			),
			shareReplay(1),
		);
		const cardsMulliganedAway$ = showWidget$.pipe(
			switchMap((showWidget) =>
				showWidget
					? this.gameState.gameState$$.pipe(
							auditTime(500),
							map((gameState) => collectMulliganedAwayCardIds(gameState?.playerDeck)),
							distinctUntilChanged((a, b) => arraysEqual(a, b)),
						)
					: of([]),
			),
			shareReplay(1),
		);

		const deckCards$ = showWidget$.pipe(
			switchMap(
				(showWidget) =>
					showWidget
						? this.gameState.gameState$$.pipe(
								auditTime(500),
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
							)
						: of(null), // Emit null or a default value when showWidget is false
			),
			shareReplay(1),
		);

		const mulliganAdvice$ = combineLatest([cardsInHand$, deckCards$, cardsMulliganedAway$]).pipe(
			// tap((info) => console.log('[mulligan-guide] mulliganAdvice 0', info)),
			filter(([cardsInHand, deckCards]) => !!cardsInHand && !!deckCards),
			// tap((info) => console.log('[mulligan-guide] mulliganAdvice 1', info)),
			debounceTime(200),
			switchMap(([cardsInHand, deckCards, cardsMulliganedAway]) =>
				combineLatest([
					archetype$,
					deckDetails$,
					format$,
					gameType$,
					playCoin$,
					playerRank$,
					opponentClass$,
					this.gameState.gameState$$.pipe(
						map((state) => state?.playerDeck.deckstring),
						distinctUntilChanged(),
					),
					this.gameStats.gameStats$$,
					this.prefs.preferences$$.pipe(
						map((prefs) => prefs.decktrackerMulliganStatsSource ?? 'community'),
						distinctUntilChanged(),
					),
					this.prefs.preferences$$.pipe(
						map((prefs) => prefs.decktrackerMulliganPersonalMinGames ?? '25'),
						distinctUntilChanged(),
					),
					this.patches.currentConstructedMetaPatch$$,
					this.prefs.preferences$$.pipe(
						map((prefs) => prefs.decktrackerMulliganTime),
						distinctUntilChanged(),
					),
				]).pipe(
					map(
						([
							archetype,
							deckDetails,
							format,
							gameType,
							playCoin,
							playerRank,
							opponentClass,
							deckstring,
							gameStats,
							statsSource,
							personalMinGames,
							patchInfo,
							timeFrame,
						]) => ({
							cardsInHand: cardsInHand,
							cardsMulliganedAway: cardsMulliganedAway,
							deckCards: deckCards,
							archetype: archetype,
							deckDetails: deckDetails,
							format: format,
							gameType: gameType,
							playCoin: playCoin,
							playerRank: playerRank,
							opponentClass: opponentClass,
							deckstring: deckstring,
							gameStats: gameStats,
							statsSource: statsSource,
							personalMinGames: personalMinGames,
							patchInfo: patchInfo,
							timeFrame: timeFrame,
						}),
					),
				),
			),
			map(
				({
					cardsInHand,
					cardsMulliganedAway,
					deckCards,
					archetype,
					deckDetails,
					format,
					gameType,
					playCoin,
					playerRank,
					opponentClass,
					deckstring,
					gameStats,
					statsSource,
					personalMinGames,
					patchInfo,
					timeFrame,
				}) => {
					console.debug(
						'[mulligan-guide] bulding mulliganAdvice$',
						archetype,
						deckDetails,
						cardsInHand,
						deckCards,
						format,
						gameType,
						playCoin,
						playerRank,
						opponentClass,
						deckstring,
					);
					const aStatToUse =
						playCoin === 'coin'
							? archetype?.coinPlayInfo.find((s) => s.coinPlay === 'coin')
							: playCoin === 'play'
								? archetype?.coinPlayInfo.find((s) => s.coinPlay === 'play')
								: archetype;
					const aMatchupInfo: readonly ConstructedMatchupInfo[] =
						archetype?.matchupInfo.map((matchup) => {
							const derivedStat =
								playCoin === 'coin'
									? matchup.coinPlayInfo.find((s) => s.coinPlay === 'coin')
									: playCoin === 'play'
										? matchup.coinPlayInfo.find((s) => s.coinPlay === 'play')
										: matchup;
							const result: ConstructedMatchupInfo = {
								...matchup,
								winrate: derivedStat?.winrate ?? matchup.winrate,
								totalGames: derivedStat?.totalGames ?? matchup.totalGames,
								wins: derivedStat?.wins ?? matchup.wins,
								losses: derivedStat?.losses ?? matchup.losses,
								cardsData: derivedStat?.cardsData ?? matchup.cardsData,
							};
							return result;
						}) ?? [];
					const dStatToUse =
						playCoin === 'coin'
							? deckDetails?.coinPlayInfo.find((s) => s.coinPlay === 'coin')
							: playCoin === 'play'
								? deckDetails?.coinPlayInfo.find((s) => s.coinPlay === 'play')
								: deckDetails;
					const dMatchupInfo: readonly ConstructedMatchupInfo[] =
						deckDetails?.matchupInfo.map((matchup) => {
							const derivedStat =
								playCoin === 'coin'
									? matchup.coinPlayInfo.find((s) => s.coinPlay === 'coin')
									: playCoin === 'play'
										? matchup.coinPlayInfo.find((s) => s.coinPlay === 'play')
										: matchup;
							const result: ConstructedMatchupInfo = {
								...matchup,
								winrate: derivedStat?.winrate ?? matchup.winrate,
								totalGames: derivedStat?.totalGames ?? matchup.totalGames,
								wins: derivedStat?.wins ?? matchup.wins,
								losses: derivedStat?.losses ?? matchup.losses,
								cardsData: derivedStat?.cardsData ?? matchup.cardsData,
							};
							return result;
						}) ?? [];

					const archetypeMatchup =
						opponentClass === 'all'
							? null
							: aMatchupInfo.find((info) => info.opponentClass === opponentClass);
					const deckMatchup =
						opponentClass === 'all'
							? null
							: dMatchupInfo.find((info) => info.opponentClass === opponentClass);
					const archetypeWinrate =
						opponentClass === 'all'
							? (aStatToUse?.winrate ?? dStatToUse?.winrate ?? 0)
							: (archetypeMatchup?.winrate ?? deckMatchup?.winrate ?? 0);
					const communityCardsData =
						opponentClass === 'all'
							? (aStatToUse?.cardsData ?? dStatToUse?.cardsData ?? [])
							: (archetypeMatchup?.cardsData ?? deckMatchup?.cardsData ?? []);
					const communitySampleSize =
						opponentClass === 'all'
							? (aStatToUse?.totalGames ?? dStatToUse?.totalGames ?? 0)
							: (archetypeMatchup?.totalGames ?? deckMatchup?.totalGames ?? 0);
					const playerDeckMatches = this.collectRankedPlayerDeckMatches(gameStats?.stats, deckstring);
					const relevantPlayerMatches = filterRelevantPlayerDeckMatches(
						playerDeckMatches,
						opponentClass,
						format as GameFormatEnum,
						playCoin ?? 'all',
						timeFrame,
						patchInfo,
					);
					void this.maybeFetchMissingCardsAnalysis(relevantPlayerMatches);
					const cardIds = deckCards?.map((refCard) => refCard.id) ?? [];
					const adviceForSource = this.buildAdviceForSource(
						statsSource,
						cardIds,
						communityCardsData,
						communitySampleSize,
						archetypeWinrate,
						relevantPlayerMatches,
						true,
						personalMinGames,
					);

					const result: MulliganGuide = {
						noData: !communityCardsData.length,
						againstAi: gameType === GameType.GT_VS_AI,
						cardsInHand: cardsInHand!,
						cardsMulliganedAway: cardsMulliganedAway,
						allDeckCards: adviceForSource.allDeckCards,
						sampleSize: adviceForSource.sampleSize,
						communitySampleSize: adviceForSource.communitySampleSize,
						personalSampleSize: adviceForSource.personalSampleSize,
						personalBelowMinGames: adviceForSource.personalBelowMinGames,
						showPersonalColumns: adviceForSource.showPersonalColumns,
						rankBracket: playerRank,
						opponentClass: opponentClass,
						format: toFormatType(format!) as GameFormatString,
						playCoin: playCoin ?? 'all',
						archetypeId: archetype?.id ?? null,
						deckstring: deckstring ?? null,
						statsSource: adviceForSource.statsSource,
					};
					return result;
				},
			),
			shareReplay(1),
		);
		combineLatest([showWidget$, mulliganAdvice$, mulliganOver$]).subscribe(([showWidget, advice, mulliganOver]) => {
			this.mulliganAdvice$$.next(showWidget && advice ? { ...advice, lingering: mulliganOver } : null);
		});
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.mulliganAdvice$$, 'constructed-mulligan-guide-mulligan-advice');
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.mulliganAdvice$$ = new BehaviorSubject<MulliganGuide | null>(null);
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod(
			'getMulliganAdviceInternal',
			(deckstring: string, prefs: Preferences, options?: MulliganGuideOptions) =>
				this.getMulliganAdviceInternal(deckstring, prefs, options),
		);
		this.registerMainProcessMethod('dismissMulliganWidgetInternal', () => this.dismissMulliganWidgetInternal());
	}

	public dismissMulliganWidget(): void {
		void this.callOnMainProcess('dismissMulliganWidgetInternal');
	}

	private dismissMulliganWidgetInternal(): void {
		this.mulliganDismissed$$.next(true);
	}

	// TODO: refactor this to get the prefs in input. Just recomputing and passing the new prefs
	// might be good enough,  to be tested
	public getMulliganAdvice(
		deckstring: string,
		prefs: Preferences,
		options?: MulliganGuideOptions,
	): Promise<MulliganGuideWithDeckStats | null> {
		return this.callOnMainProcess<MulliganGuideWithDeckStats | null>(
			'getMulliganAdviceInternal',
			deckstring,
			prefs,
			options,
		);
	}

	protected async getMulliganAdviceInternal(
		deckstring: string,
		prefs: Preferences,
		options?: MulliganGuideOptions,
	): Promise<MulliganGuideWithDeckStats | null> {
		const deckDefinition = decode(deckstring);
		const format = options?.useDeckFormat
			? (deckDefinition.format as GameFormatEnum)
			: (prefs.decktrackerMulliganFormatOverride ?? GameFormatEnum.FT_STANDARD);
		const playCoin = prefs.decktrackerMulliganPlayCoinOoc;
		const playerRank = prefs.decktrackerMulliganRankBracket;
		const opponentClass = prefs.decktrackerOocMulliganOpponent;
		const timeFrame = prefs.decktrackerMulliganTime;
		const patchInfo = await this.patches.currentConstructedMetaPatch$$.getValueWithInit();
		const archetypeForDeck = await this.archetypeService.getArchetypeForDeck(deckstring);
		const archetypeOverrides = prefs.constructedDeckArchetypeOverrides;
		const archetypeId = (!!deckstring ? archetypeOverrides[deckstring] : null) ?? archetypeForDeck;
		const archetype = await this.archetypes.loadNewArchetypeDetails(
			archetypeId as number,
			toFormatType(format as any) as GameFormat,
			timeFrame,
			playerRank,
		);
		const deckDetails = await this.archetypes.loadNewDeckDetailsInternal(
			deckstring,
			toFormatType(format as any) as GameFormat,
			timeFrame,
			playerRank,
		);
		const deckCards = deckDefinition?.cards?.map((card) => card[0]).map((dbfId) => this.allCards.getCard(dbfId).id);
		const allGames = await this.gameStats.gameStats$$.getValueWithInit();
		const playerDeckMatches = this.collectRankedPlayerDeckMatches(allGames?.stats, deckstring);

		return await this.getStatsFor(
			deckstring,
			deckCards,
			opponentClass,
			timeFrame,
			playerRank,
			format,
			playCoin ?? 'all',
			patchInfo,
			archetype,
			deckDetails,
			playerDeckMatches,
			prefs.decktrackerMulliganStatsSource ?? 'community',
		);
	}

	private async getStatsFor(
		deckstring: string,
		cardsToGetStatsFor: readonly string[],
		opponentClass: string,
		timeFrame: 'last-patch' | 'past-3' | 'past-7',
		playerRank: RankBracket,
		format: GameFormatEnum,
		playCoin: 'coin' | 'play' | 'all',
		patchInfo: PatchInfo | null | undefined,
		archetype: ArchetypeStat | null,
		deckDetails: DeckStat | null,
		playerDeckMatches?: readonly GameStat[],
		statsSource: MulliganStatsSource = 'community',
	) {
		const aStatToUse =
			playCoin === 'coin'
				? archetype?.coinPlayInfo.find((s) => s.coinPlay === 'coin')
				: playCoin === 'play'
					? archetype?.coinPlayInfo.find((s) => s.coinPlay === 'play')
					: archetype;
		const aMatchupInfo: readonly ConstructedMatchupInfo[] =
			archetype?.matchupInfo.map((matchup) => {
				const derivedStat =
					playCoin === 'coin'
						? matchup.coinPlayInfo.find((s) => s.coinPlay === 'coin')
						: playCoin === 'play'
							? matchup.coinPlayInfo.find((s) => s.coinPlay === 'play')
							: matchup;
				const result: ConstructedMatchupInfo = {
					...matchup,
					winrate: derivedStat?.winrate ?? matchup.winrate,
					totalGames: derivedStat?.totalGames ?? matchup.totalGames,
					wins: derivedStat?.wins ?? matchup.wins,
					losses: derivedStat?.losses ?? matchup.losses,
					cardsData: derivedStat?.cardsData ?? matchup.cardsData,
				};
				return result;
			}) ?? [];
		const dStatToUse =
			playCoin === 'coin'
				? deckDetails?.coinPlayInfo.find((s) => s.coinPlay === 'coin')
				: playCoin === 'play'
					? deckDetails?.coinPlayInfo.find((s) => s.coinPlay === 'play')
					: deckDetails;
		const dMatchupInfo: readonly ConstructedMatchupInfo[] =
			deckDetails?.matchupInfo.map((matchup) => {
				const derivedStat =
					playCoin === 'coin'
						? matchup.coinPlayInfo.find((s) => s.coinPlay === 'coin')
						: playCoin === 'play'
							? matchup.coinPlayInfo.find((s) => s.coinPlay === 'play')
							: matchup;
				const result: ConstructedMatchupInfo = {
					...matchup,
					winrate: derivedStat?.winrate ?? matchup.winrate,
					totalGames: derivedStat?.totalGames ?? matchup.totalGames,
					wins: derivedStat?.wins ?? matchup.wins,
					losses: derivedStat?.losses ?? matchup.losses,
					cardsData: derivedStat?.cardsData ?? matchup.cardsData,
				};
				return result;
			}) ?? [];

		const archetypeMatchup =
			opponentClass === 'all' ? null : aMatchupInfo.find((info) => info.opponentClass === opponentClass);
		const deckMatchup =
			opponentClass === 'all' ? null : dMatchupInfo.find((info) => info.opponentClass === opponentClass);
		const archetypeWinrate =
			opponentClass === 'all'
				? (aStatToUse?.winrate ?? dStatToUse?.winrate ?? 0)
				: (archetypeMatchup?.winrate ?? deckMatchup?.winrate ?? 0);
		const communityCardsData =
			opponentClass === 'all'
				? (aStatToUse?.cardsData ?? dStatToUse?.cardsData ?? [])
				: (archetypeMatchup?.cardsData ?? deckMatchup?.cardsData ?? []);
		const communitySampleSize =
			opponentClass === 'all'
				? (aStatToUse?.totalGames ?? dStatToUse?.totalGames ?? 0)
				: (archetypeMatchup?.totalGames ?? deckMatchup?.totalGames ?? 0);
		const relevantPlayerDeckMatches = filterRelevantPlayerDeckMatches(
			playerDeckMatches,
			opponentClass,
			format,
			playCoin,
			timeFrame,
			patchInfo,
		);
		await this.maybeFetchMissingCardsAnalysis(relevantPlayerDeckMatches);
		const latestStats = await this.gameStats.gameStats$$.getValueWithInit();
		const refreshedMatches = this.collectRankedPlayerDeckMatches(latestStats?.stats, deckstring);
		const relevantAfterLookup = filterRelevantPlayerDeckMatches(
			refreshedMatches.length ? refreshedMatches : relevantPlayerDeckMatches,
			opponentClass,
			format,
			playCoin,
			timeFrame,
			patchInfo,
		);
		const adviceForSource = this.buildAdviceForSource(
			statsSource,
			cardsToGetStatsFor,
			communityCardsData,
			communitySampleSize,
			archetypeWinrate,
			relevantAfterLookup,
			false,
			'always',
		);

		const globalDeckStats =
			opponentClass === 'all' ? dStatToUse : dMatchupInfo?.find((m) => m.opponentClass === opponentClass);
		console.debug('globalDeckStats', globalDeckStats, deckDetails);
		const playerWins = relevantAfterLookup.filter((m) => m.result === 'won').length;
		const result: MulliganGuideWithDeckStats = {
			noData: !communityCardsData.length,
			againstAi: false,
			cardsInHand: [],
			cardsMulliganedAway: [],
			allDeckCards: adviceForSource.allDeckCards,
			sampleSize: adviceForSource.sampleSize,
			communitySampleSize: adviceForSource.communitySampleSize,
			personalSampleSize: adviceForSource.personalSampleSize,
			personalBelowMinGames: adviceForSource.personalBelowMinGames,
			showPersonalColumns: adviceForSource.showPersonalColumns,
			rankBracket: playerRank,
			opponentClass: opponentClass,
			format: toFormatType(format) as GameFormatString,
			playCoin: playCoin,
			archetypeId: archetype?.id ?? null,
			deckstring: deckstring ?? null,
			statsSource: adviceForSource.statsSource,
			globalDeckStats: {
				totalGames: globalDeckStats?.totalGames ?? 0,
				winrate: globalDeckStats?.winrate ?? null,
			},
			playerDeckStats: {
				totalGames: relevantAfterLookup.length ?? 0,
				winrate: !relevantAfterLookup.length ? null : playerWins / relevantAfterLookup.length,
			},
		};
		return result;
	}

	private buildAdviceForSource(
		statsSource: MulliganStatsSource,
		cardIds: readonly string[],
		communityCardsData: readonly AggregatedCardMulliganData[],
		communitySampleSize: number,
		communityWinrate: number,
		relevantPlayerMatches: readonly GameStat[],
		applyMinGames: boolean,
		personalMinGames: MulliganPersonalMinGames,
	): {
		allDeckCards: readonly MulliganCardAdvice[];
		sampleSize: number;
		personalSampleSize: number;
		communitySampleSize: number;
		personalBelowMinGames: boolean;
		showPersonalColumns: boolean;
		statsSource: MulliganStatsSource;
	} {
		const personalCardsData = aggregatePersonalCardMulliganData(relevantPlayerMatches);
		const personalSampleSize = relevantPlayerMatches.filter((m) => !!m.cardsAnalysis?.length).length;
		const personalAllowed = applyMinGames
			? meetsPersonalMinGames(personalSampleSize, personalMinGames)
			: personalSampleSize > 0;
		const playerWins = relevantPlayerMatches.filter((m) => m.result === 'won').length;
		const personalWinrate = relevantPlayerMatches.length ? playerWins / relevantPlayerMatches.length : 0;
		const communityAdvice = buildMulliganCardAdvice(
			cardIds,
			communityCardsData,
			communityWinrate,
			(cardId, cardsData) => this.findCardData(cardId, cardsData),
		);
		const lockToCommunity = applyMinGames && !personalAllowed;
		const effectiveSource: MulliganStatsSource = lockToCommunity ? 'community' : statsSource;
		const personalBelowMinGames = lockToCommunity;
		const showPersonalColumns = effectiveSource === 'both';
		const personalAdvice =
			effectiveSource === 'personal' || effectiveSource === 'both'
				? buildMulliganCardAdvice(cardIds, personalCardsData, personalWinrate, (cardId, cardsData) =>
						this.findCardData(cardId, cardsData),
					)
				: null;

		if (effectiveSource === 'both' && personalAdvice) {
			return {
				allDeckCards: mergeCommunityAndPersonalAdvice(communityAdvice, personalAdvice),
				sampleSize: communitySampleSize,
				personalSampleSize: personalSampleSize,
				communitySampleSize: communitySampleSize,
				personalBelowMinGames: personalBelowMinGames,
				showPersonalColumns: showPersonalColumns,
				statsSource: effectiveSource,
			};
		}
		if (effectiveSource === 'personal' && personalAdvice) {
			return {
				allDeckCards: personalAdvice,
				sampleSize: personalSampleSize,
				personalSampleSize: personalSampleSize,
				communitySampleSize: communitySampleSize,
				personalBelowMinGames: personalBelowMinGames,
				showPersonalColumns: false,
				statsSource: effectiveSource,
			};
		}
		return {
			allDeckCards: communityAdvice,
			sampleSize: communitySampleSize,
			personalSampleSize: personalSampleSize,
			communitySampleSize: communitySampleSize,
			personalBelowMinGames: personalBelowMinGames,
			showPersonalColumns: false,
			statsSource: effectiveSource,
		};
	}

	private collectRankedPlayerDeckMatches(
		stats: readonly GameStat[] | null | undefined,
		deckstring: string | null | undefined,
	): readonly GameStat[] {
		return (
			stats
				?.filter((s) => s.gameMode === 'ranked')
				.filter((s) =>
					isSamePlayerDecklist(s.playerDecklist, deckstring, (d) => this.allCards.normalizeDeckList(d)),
				) ?? []
		);
	}

	private findCardData(
		cardId: string,
		cardsData: readonly AggregatedCardMulliganData[],
	): AggregatedCardMulliganData | undefined {
		return (
			cardsData.find(
				(card) =>
					getBaseCardId(card.cardId, this.allCards.getService()) ===
					getBaseCardId(cardId, this.allCards.getService()),
			) ??
			cardsData.find(
				(card) =>
					this.allCards.getRootCardId(getBaseCardId(card.cardId, this.allCards.getService())) ===
					this.allCards.getRootCardId(getBaseCardId(cardId, this.allCards.getService())),
			)
		);
	}

	private async maybeFetchMissingCardsAnalysis(matches: readonly GameStat[]): Promise<void> {
		if (!this.ads.hasPremiumSub$$.getValue()) {
			return;
		}
		const prefs = await this.prefs.getPreferences();
		if (
			prefs.decktrackerMulliganDownloadPastStats === false ||
			prefs.decktrackerMulliganPersonalMinGames === 'never'
		) {
			return;
		}
		const missing = matches
			.filter((match) => match.cardsAnalysis == null && !!match.reviewId)
			.map((match) => match.reviewId)
			.filter((reviewId) => !this.fetchingReviewIds.has(reviewId));
		if (!missing.length) {
			return;
		}
		missing.forEach((reviewId) => this.fetchingReviewIds.add(reviewId));
		try {
			await this.fetchAndStoreCardsAnalysis(missing);
		} catch (e) {
			console.warn('[mulligan-guide] cardsAnalysis lookup failed', e);
		} finally {
			missing.forEach((reviewId) => this.fetchingReviewIds.delete(reviewId));
		}
	}

	private async fetchAndStoreCardsAnalysis(reviewIds: readonly string[]): Promise<void> {
		const user = await this.user.getCurrentUser();
		if (!user?.userId && !user?.username) {
			return;
		}
		const found = new Map<string, readonly CardAnalysis[]>();
		for (const batch of chunkReviewIds(reviewIds, CARDS_ANALYSIS_LOOKUP_BATCH_SIZE)) {
			const data = await this.api.callPostApi<{
				results?: readonly { reviewId: string; cardsAnalysis?: readonly CardAnalysis[] }[];
			}>(CARDS_ANALYSIS_LOOKUP_URL, {
				userId: user.userId,
				userName: user.username,
				reviewIds: batch,
			});
			if (!data) {
				continue;
			}
			for (const row of data.results ?? []) {
				if (row?.reviewId) {
					found.set(row.reviewId, row.cardsAnalysis ?? []);
				}
			}
		}
		if (!found.size) {
			return;
		}
		await this.gameStats.updateCardsAnalysis(
			[...found.entries()].map(([reviewId, cardsAnalysis]) => ({
				reviewId,
				cardsAnalysis,
			})),
		);
	}
}

export interface MulliganGuideWithDeckStats extends MulliganGuide {
	globalDeckStats: MulliganDeckStats;
	playerDeckStats: MulliganDeckStats;
}
export interface MulliganDeckStats {
	totalGames: number;
	winrate: number | null;
}
export interface MulliganGuideOptions {
	useDeckFormat?: boolean;
}

export const collectMulliganedAwayCardIds = (
	playerDeck:
		| {
				deck?: readonly { cardId?: string; mulliganedAway?: boolean }[];
				hand?: readonly { cardId?: string; mulliganedAway?: boolean }[];
				board?: readonly { cardId?: string; mulliganedAway?: boolean }[];
				otherZone?: readonly { cardId?: string; mulliganedAway?: boolean }[];
		  }
		| null
		| undefined,
): readonly string[] => {
	if (!playerDeck) {
		return [];
	}
	return [
		...(playerDeck.deck ?? []),
		...(playerDeck.hand ?? []),
		...(playerDeck.board ?? []),
		...(playerDeck.otherZone ?? []),
	]
		.filter((card) => card.mulliganedAway && !!card.cardId)
		.map((card) => card.cardId!);
};
