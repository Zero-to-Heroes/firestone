import { Inject, Injectable } from '@angular/core';
import { GameType, isBattlegrounds, isMercenaries } from '@firestone-hs/reference-data';
import { ArenaInfoService } from '@firestone/arena/common';
import {
	GameEvent,
	GameEventsEmitterService,
	GameSettingsEvent,
	GameStateFacadeService,
	GameUniqueIdService,
	HsGameMetaData,
	ReviewIdService,
} from '@firestone/game-state';
import { LotteryFacadeService } from '@firestone/lottery/common';
import { BattlegroundsInfo, MatchInfo, MemoryInspectionService, MemoryUpdatesService } from '@firestone/memory';
import { MercenariesMemoryCacheService } from '@firestone/mercenaries/common';
import { GameStatusService, sanitizeDeckstring } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, merge } from 'rxjs';
import {
	concatMap,
	distinctUntilChanged,
	filter,
	map,
	shareReplay,
	startWith,
	switchMap,
	take,
	tap,
	withLatestFrom,
} from 'rxjs/operators';
import { APP_VERSION_SERVICE_TOKEN, IAppVersionService } from './app-version.interface';
import { EndGameUploaderService, UploadInfo } from './end-game-uploader.service';
import { RewardMonitorService } from './rewards-monitor.service';

@Injectable({ providedIn: 'root' })
export class EndGameListenerService {
	private uploadStarted$$ = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly memoryUpdates: MemoryUpdatesService,
		private readonly endGameUploader: EndGameUploaderService,
		private readonly mercsMemoryCache: MercenariesMemoryCacheService,
		private readonly memoryInspection: MemoryInspectionService,
		private readonly rewards: RewardMonitorService,
		private readonly reviewIdService: ReviewIdService,
		private readonly lottery: LotteryFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly gameStatus: GameStatusService,
		private readonly arenaInfo: ArenaInfoService,
		private readonly gameState: GameStateFacadeService,
		private readonly gameUniqueId: GameUniqueIdService,
		@Inject(APP_VERSION_SERVICE_TOKEN) private readonly appVersionService: IAppVersionService,
	) {
		this.init();
	}

	private async init() {
		await waitForReady(this.gameState, this.mercsMemoryCache);

		this.gameStatus.inGame$$
			.pipe(
				filter((inGame) => !!inGame),
				take(1),
			)
			.subscribe(async () => {
				console.log('[manastorm-bridge] game started, initializing');
				const metadata$ = this.gameEvents.allEvents.asObservable().pipe(
					filter((event) => event.type === GameEvent.MATCH_METADATA),
					map((event) => event.additionalData.metaData as HsGameMetaData),
					startWith(null),
					shareReplay(1),
				);
				const matchInfo$ = this.gameEvents.allEvents.asObservable().pipe(
					filter((event) => event.type === GameEvent.MATCH_INFO),
					map((event) => event.additionalData.matchInfo as MatchInfo),
					startWith(null),
					shareReplay(1),
				);
				const uniqueId$ = this.gameUniqueId.uniqueId$$.asObservable().pipe(startWith(null), shareReplay(1));
				// Why use this instead of the deckstring from the game state?
				// How to make sure the "new" version doesn't override the old one once the game is over?
				const playerDeck$: Observable<{ deckstring: string | null; name: string | null } | null> =
					this.gameState.gameState$$.pipe(
						// Using GAME_END here means there is a race, and can cause the deck to not be properly assigned
						// filter(
						// 	(info) =>
						// 		info?.event?.name === GameEvent.GAME_SETTINGS ||
						// 		info?.event?.name === GameEvent.WHIZBANG_DECK_ID,
						// ),
						// filter((state) => !!state?.playerDeck?.deckstring),
						map((state) => ({
							name: state.playerDeck?.name ?? null,
							deckstring: sanitizeDeckstring(state.playerDeck?.deckstring, this.allCards),
						})),
						startWith(null),
						distinctUntilChanged((a, b) => a?.deckstring === b?.deckstring && a?.name === b?.name),
						tap((info) => console.log('[manastorm-bridge] playerDeck', info?.deckstring, info?.name)),
						shareReplay(1),
					);

				const arenaInfo$ = this.arenaInfo.arenaInfo$$.asObservable();

				// TODO: only if in mercs game
				const mercsInfo$ = metadata$.pipe(
					filter((meta) => isMercenaries(meta?.GameType as GameType)),
					switchMap((meta) => this.mercsMemoryCache.memoryMapInfo$$),
					startWith(null),
				);
				const mercsCollectionInfo$ = metadata$.pipe(
					filter((meta) => isMercenaries(meta?.GameType as GameType)),
					switchMap((meta) => this.mercsMemoryCache.memoryCollectionInfo$$),
					startWith(null),
				);

				const bgInfo$ = this.gameEvents.allEvents.asObservable().pipe(
					filter((event) => event.type === GameEvent.BATTLEGROUNDS_INFO),
					map((event) => event.additionalData.bgInfo as BattlegroundsInfo),
					startWith(null),
				);
				const gameSettings$ = this.gameEvents.allEvents.asObservable().pipe(
					filter((event) => event.type === GameEvent.GAME_SETTINGS),
					map((event) => event as GameSettingsEvent),
					map((event) => event.additionalData),
					startWith(null),
				);
				// This is triggered really early: as soon as the GameState match is over (no need to wait for
				// the final combat animations)
				const bgNewRating$ = this.memoryUpdates.memoryUpdates$$.pipe(
					filter((changes) => !!changes.BattlegroundsNewRating),
					map((changes) => changes.BattlegroundsNewRating),
					startWith(null),
					distinctUntilChanged(),
					shareReplay(1),
					tap((info) => console.debug('[manastorm-bridge] bgNewRating', info)),
				);
				const reviewId$ = this.reviewIdService.reviewId$$;
				// Doesn't work, reviewId arrives earlier
				const gameEnded$: Observable<{
					ended: boolean;
					spectating: boolean;
					replayXml: string | null;
					GameType: number | null;
					FormatType: number | null;
					ScenarioID: number | null;
				}> = merge(
					this.gameEvents.allEvents.asObservable().pipe(filter((event) => event.type === GameEvent.GAME_END)),
					this.gameEvents.allEvents
						.asObservable()
						.pipe(filter((event) => event.type === GameEvent.GAME_START)),
					this.uploadStarted$$,
				).pipe(
					// tap((info) => console.log('[manastorm-bridge] game ended', info)),
					map((event) => {
						// The uploadStarted subject fired, we reset the "ended" flag so that a new review id
						// won't trigger a new upload
						if (!(event as GameEvent)?.type) {
							return {
								ended: false,
								spectating: false,
								replayXml: null,
								FormatType: null,
								GameType: null,
								ScenarioID: null,
							};
						}
						if ((event as GameEvent).type === GameEvent.GAME_END) {
							const endEvent = event as GameEvent;
							return {
								ended: true,
								spectating: endEvent.additionalData.spectating,
								replayXml: endEvent.additionalData.replayXml,
								GameType: endEvent.additionalData.GameType,
								FormatType: endEvent.additionalData.FormatType,
								ScenarioID: endEvent.additionalData.ScenarioID,
							};
						}
						if ((event as GameEvent).type === GameEvent.GAME_START) {
							const startEvent = event as GameEvent;
							return {
								ended: false,
								spectating: startEvent.additionalData.spectating,
								replayXml: null,
								GameType: null,
								FormatType: null,
								ScenarioID: null,
							};
						}
						return {
							ended: false,
							spectating: false,
							replayXml: null,
							FormatType: null,
							GameType: null,
							ScenarioID: null,
						};
					}),
					startWith({
						ended: false,
						spectating: false,
						replayXml: null,
						GameType: null,
						FormatType: null,
						ScenarioID: null,
					}),
					distinctUntilChanged(
						(a, b) =>
							a?.ended === b?.ended &&
							a?.spectating === b?.spectating &&
							a?.FormatType === b?.FormatType &&
							a?.GameType === b?.GameType &&
							a?.ScenarioID === b?.ScenarioID &&
							a?.replayXml === b?.replayXml,
					),
					tap((info) => console.debug('[manastorm-bridge] gameEnded', info)),
				);

				// Ideally we should retrieve this after the bgNewRating$ emits. However, since it's possible
				// that the rating doesn't change, this obersvable isn't reliable enough
				// It actually emits even if the ranking doesn't change, so we can use that
				const bgMemoryInfo$ = bgNewRating$.pipe(
					filter((newRating) => newRating != null),
					distinctUntilChanged(),
					concatMap(async (_) => {
						return await this.getBattlegroundsEndGame();
					}),
					startWith(null),
					distinctUntilChanged((a, b) => {
						// console.debug('[manastorm-bridge] looking for BG end game info', a, b);
						return deepEqual(a, b);
					}),
					tap((info) => console.debug('[manastorm-bridge] bgMemoryInfo', info)),
				);

				combineLatest([
					reviewId$,
					metadata$,
					gameEnded$,
					gameSettings$,
					mercsInfo$,
					mercsCollectionInfo$,
					matchInfo$,
					playerDeck$,
					arenaInfo$,
					bgInfo$,
					uniqueId$,
				])
					.pipe(
						withLatestFrom(bgMemoryInfo$, bgNewRating$),
						map(
							([
								[
									reviewId,
									metadata,
									gameEnded,
									gameSettings,
									mercsInfo,
									mercsCollectionInfo,
									matchInfo,
									playerDeck,
									arenaInfo,
									bgInfo,
									uniqueId,
								],
								bgMemoryInfo,
								bgNewRating,
							]) =>
								({
									reviewId: reviewId,
									metadata: metadata,
									gameEnded: gameEnded,
									matchInfo: matchInfo,
									uniqueId: uniqueId,
									playerDeck: playerDeck,
									arenaInfo: arenaInfo,
									mercsInfo: mercsInfo,
									mercsCollectionInfo: mercsCollectionInfo,
									bgInfo: bgInfo,
									bgNewRating: bgNewRating,
									battlegroundsInfoAfterGameOver: bgMemoryInfo,
									gameSettings: gameSettings,
								}) as UploadInfo,
						),
						// tap((info) => console.debug('[manastorm-bridge] triggering final observable', info)),
						// We don't want to trigger anything unless the gameEnded status changed (to mark the end of
						// the current game) or the reviewId changed (to mark the start)
						filter((info) => !!info.reviewId && info.gameEnded.ended),
						filter((info) => !info.gameEnded.spectating),
						distinctUntilChanged((a, b) => {
							// console.debug('[manastorm-bridge] comparing', a, b);
							return (
								a?.reviewId === b?.reviewId &&
								a?.gameEnded?.ended === b?.gameEnded?.ended &&
								a?.uniqueId === b?.uniqueId
							);
						}),
						// tap((info) =>
						// 	console.debug(
						// 		'[manastorm-bridge] end game, uploading? spectating=',
						// 		info.gameEnded.spectating,
						// 	),
						// ),
						// distinctUntilChanged((a, b) => deepEqual(a, b)),
						tap((info) =>
							console.debug(
								'[manastorm-bridge] not a spectate game, continuing',
								info.metadata,
								info.playerDeck,
							),
						),
					)
					.subscribe((info) => {
						this.prepareUpload(info);
						this.uploadStarted$$.next(!this.uploadStarted$$.value);
					});
			});
	}

	// Load all the memory info that has to be loaded once the game is over
	private async prepareUpload(info: UploadInfo) {
		// Get the memory info first, because parsing the XML can take some time and make the
		// info in memory stale / unavailable
		console.log('[manastorm-bridge] preparing to upload');
		// Here we get the information that is only available once the game is over
		// Try to get the BG new rank info as soon as possible. If that doesn't work, we have a fallback
		const bgNewRatingMemoryUpdate = info.bgNewRating && info.bgNewRating !== -1 ? info.bgNewRating : null;
		const afterInfoNewRating =
			info.battlegroundsInfoAfterGameOver?.NewRating != null &&
			info.battlegroundsInfoAfterGameOver.NewRating !== -1
				? info.battlegroundsInfoAfterGameOver.NewRating
				: null;
		const bgNewRating = bgNewRatingMemoryUpdate ?? afterInfoNewRating;
		console.log('[manastorm-bridge] final bgNewRating', bgNewRating);
		const newBgInfo =
			info.battlegroundsInfoAfterGameOver?.NewRating != null &&
			info.battlegroundsInfoAfterGameOver.NewRating !== -1
				? info.battlegroundsInfoAfterGameOver
				: isBattlegrounds(info.metadata.GameType)
					? await this.getBattlegroundsEndGame()
					: null;
		const newBgInfoWithRating: BattlegroundsInfo | null = !!newBgInfo
			? {
					...newBgInfo,
					NewRating: bgNewRating ?? newBgInfo.NewRating,
				}
			: null;
		const xpForGame = await this.rewards.getXpForGameInfo();
		console.log('[manastorm-bridge] read memory info');

		const battleOdds = this.gameState.gameState$$.value?.bgState?.currentGame?.faceOffs?.map((f) => ({
			turn: f.turn,
			wonPercent: f.battleResult?.wonPercent ?? 0,
		}));
		const augmentedInfo: UploadInfo = {
			...info,
			battlegroundsInfoAfterGameOver: newBgInfoWithRating ?? undefined,
			xpForGame: xpForGame ?? undefined,
			bgBattleOdds: battleOdds,
			// Here we purposefully don't want to init the lottery if it hasn't been initialized yet
			lotteryPoints: this.lottery.lottery$$.getValue()?.currentPoints(),
			bgGame: this.gameState.gameState$$.value?.bgState?.currentGame ?? undefined,
		};
		console.debug('[manastorm-bridge] augmentedInfo', augmentedInfo);

		const appVersion = await this.appVersionService.getAppVersion();
		await this.endGameUploader.upload2(augmentedInfo, appVersion);
	}

	private async getBattlegroundsEndGame(): Promise<BattlegroundsInfo | null> {
		const result = await this.memoryInspection.getBattlegroundsEndGame();
		console.log(
			'[manastorm-bridge] received BG rank result',
			result?.Rating,
			result?.DuosRating,
			result?.NewRating,
		);
		return result;
	}
}
