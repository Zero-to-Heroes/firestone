import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, merge } from 'rxjs';
import { concatMap, distinctUntilChanged, filter, map, startWith, tap, withLatestFrom } from 'rxjs/operators';
import { ArenaInfo } from '../../models/arena-info';
import { BattlegroundsInfo } from '../../models/battlegrounds-info';
import { GameEvent } from '../../models/game-event';
import { GameSettingsEvent } from '../../models/mainwindow/game-events/game-settings-event';
import { MatchInfo } from '../../models/match-info';
import { DuelsInfo } from '../../models/memory/memory-duels';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { isBattlegrounds } from '../battlegrounds/bgs-utils';
import { DeckInfo } from '../decktracker/deck-parser.service';
import { DuelsRunIdService } from '../duels/duels-run-id.service';
import { DuelsStateBuilderService } from '../duels/duels-state-builder.service';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { HsGameMetaData } from '../game-mode-data.service';
import { MercenariesMemoryCacheService } from '../mercenaries/mercenaries-memory-cache.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { ReviewIdService } from '../review-id.service';
import { RewardMonitorService } from '../rewards/rewards-monitor';
import { sleep } from '../utils';
import { EndGameUploaderService, UploadInfo } from './end-game-uploader.service';

@Injectable()
export class EndGameListenerService {
	private uploadStarted$$ = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly events: Events,
		private readonly endGameUploader: EndGameUploaderService,
		private readonly mercsMemoryCache: MercenariesMemoryCacheService,
		private readonly memoryInspection: MemoryInspectionService,
		private readonly rewards: RewardMonitorService,
		private readonly duelsState: DuelsStateBuilderService,
		private readonly reviewIdService: ReviewIdService,
		private readonly duelsRunIdService: DuelsRunIdService,
	) {
		this.init();
	}

	private init(): void {
		console.log('[manastorm-bridge] stgarting end-game-listener init');
		const metadata$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.MATCH_METADATA),
			map((event) => event.additionalData.metaData as HsGameMetaData),
			startWith(null),
			// tap((info) => console.debug('[manastorm-bridge] metaData', info)),
		);
		const matchInfo$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.MATCH_INFO),
			map((event) => event.additionalData.matchInfo as MatchInfo),
			startWith(null),
			// tap((info) => console.debug('[manastorm-bridge] matchInfo', info)),
		);
		const playerDeck$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.PLAYER_DECK_INFO),
			map((event) => event.additionalData.playerDeck as DeckInfo),
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] playerDeck', info)),
		);
		const duelsInfo$ = this.duelsState.duelsInfo$$
			.asObservable()
			.pipe
			// tap((info) => console.debug('[manastorm-bridge] duelsInfo', info))
			();
		const duelsRunId$ = this.duelsRunIdService.duelsRunId$
			.pipe
			// tap((info) => console.debug('[manastorm-bridge] duelsRunId', info)),
			();
		const arenaInfo$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.ARENA_INFO),
			map((event) => event.additionalData.arenaInfo as ArenaInfo),
			startWith(null),
			// tap((info) => console.debug('[manastorm-bridge] arenaInfo', info)),
		);
		const mercsInfo$ = this.mercsMemoryCache.memoryMapInfo$.pipe(
			startWith(null),
			// tap((info) => console.debug('[manastorm-bridge] mercsInfo', info)),
		);
		const mercsCollectionInfo$ = this.mercsMemoryCache.memoryCollectionInfo$.pipe(
			startWith(null),
			// tap((info) => console.debug('[manastorm-bridge] mercsCollectionInfo', info)),
		);
		const bgInfo$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.BATTLEGROUNDS_INFO),
			map((event) => event.additionalData.bgInfo as BattlegroundsInfo),
			startWith(null),
			// tap((info) => console.debug('[manastorm-bridge] bgInfo', info)),
		);
		const gameSettings$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.GAME_SETTINGS),
			map((event) => event as GameSettingsEvent),
			map((event) => event.additionalData),
			startWith(null),
			// tap((info) => console.debug('[manastorm-bridge] gameSettings', info)),
		);
		// This is triggered really early: as soon as the GameState match is over (no need to wait for
		// the final combat animations)
		const bgNewRating$ = this.events.on(Events.MEMORY_UPDATE).pipe(
			map((event) => event.data[0] as MemoryUpdate),
			filter((changes) => !!changes.BattlegroundsNewRating),
			map((changes) => changes.BattlegroundsNewRating),
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] bgNewRating', info)),
			// share(), // This prevents the trigger of other observables?
		);
		const reviewId$ = this.reviewIdService.reviewId$;
		// Doesn't work, reviewId arrives earlier
		const gameEnded$ = merge(
			this.gameEvents.allEvents.asObservable().pipe(filter((event) => event.type === GameEvent.GAME_END)),
			this.gameEvents.allEvents.asObservable().pipe(filter((event) => event.type === GameEvent.GAME_START)),
			this.uploadStarted$$,
		).pipe(
			tap((info) => console.debug('[manastorm-bridge] game ended', info)),
			map((event) => {
				// The uploadStarted subject fired, we reset the "ended" flag so that a new review id
				// won't trigger a new upload
				if (!(event as GameEvent).type) {
					return {
						ended: false,
						spectating: false,
						game: null,
						replayXml: null,
					};
				}
				if ((event as GameEvent).type === GameEvent.GAME_END) {
					const endEvent = event as GameEvent;
					return {
						ended: true,
						spectating: endEvent.additionalData.spectating,
						game: endEvent.additionalData.game,
						replayXml: endEvent.additionalData.replayXml,
					};
				}
				if ((event as GameEvent).type === GameEvent.GAME_START) {
					const startEvent = event as GameEvent;
					return {
						ended: false,
						spectating: startEvent.additionalData.spectating,
						game: null,
						replayXml: null,
					};
				}
			}),
			startWith({ ended: false, spectating: false, game: null, replayXml: null }),
			// tap((info) => console.debug('[manastorm-bridge] gameEnded', info)),
		);

		// Ideally we should retrieve this after the bgNewRating$ emits. However, since it's possible
		// that the rating doesn't change, this obersvable isn't reliable enough
		// It actually emits even if the ranking doesn't change, so we can use that
		const bgMemoryInfo$ = bgNewRating$.pipe(
			concatMap(async (_) => {
				return await this.getBattlegroundsEndGame();
			}),
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] bgMemoryInfo', info)),
		);

		combineLatest(
			// Groups of 6 max to have type inferrence
			[
				reviewId$,
				metadata$,
				gameEnded$,
				gameSettings$,
				mercsInfo$,
				mercsCollectionInfo$,
				duelsRunId$,
				duelsInfo$,
				matchInfo$,
				playerDeck$,
				arenaInfo$,
				bgInfo$,
			],
		)
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
							duelsRunId,
							duelsInfo,
							matchInfo,
							playerDeck,
							arenaInfo,
							bgInfo,
						],
						bgMemoryInfo,
						bgNewRating,
					]) =>
						({
							reviewId: reviewId,
							metadata: metadata,
							gameEnded: gameEnded,
							matchInfo: matchInfo,
							playerDeck: playerDeck,
							duelsInfo: duelsInfo,
							arenaInfo: arenaInfo,
							mercsInfo: mercsInfo,
							mercsCollectionInfo: mercsCollectionInfo,
							bgInfo: bgInfo,
							gameSettings: gameSettings,
							duelsRunId: duelsRunId,
							bgNewRating: bgNewRating,
							battlegroundsInfoAfterGameOver: bgMemoryInfo,
						} as UploadInfo),
				),
				tap((info) => console.debug('[manastorm-bridge] triggering final observable', info)),
				// We don't want to trigger anything unless the gameEnded status changed (to mark the end of
				// the current game) or the reviewId changed (to mark the start)
				distinctUntilChanged((a, b) => {
					// console.debug('[manastorm-bridge] comparing', a, b);
					return a?.reviewId === b?.reviewId && a?.gameEnded?.ended === b?.gameEnded?.ended;
				}),
				// tap((info) => console.debug('[manastorm-bridge] triggering end game pipes')),
				filter((info) => !!info.reviewId && info.gameEnded.ended),
				tap((info) =>
					console.log('[manastorm-bridge] end game, uploading? spectating=', info.gameEnded.spectating),
				),
				filter((info) => !info.gameEnded.spectating),
				tap((info) =>
					console.log('[manastorm-bridge] not a spectate game, continuing', info.metadata, info.playerDeck),
				),
				// tap((info) => console.debug('[manastorm-bridge] will prepare for upload', info)),
				// map(info => )
			)
			.subscribe((info) => {
				this.prepareUpload(info);
				this.uploadStarted$$.next(!this.uploadStarted$$.value);
			});
	}

	// Load all the memory info that has to be loaded once the game is over
	private async prepareUpload(info: UploadInfo) {
		// Get the memory info first, because parsing the XML can take some time and make the
		// info in memory stale / unavailable
		console.log('[manastorm-bridge] reading memory info');
		// Here we get the information that is only available once the game is over
		// TODO: move this elsewhere? So that this method doesn't care about memory reading at all anymore
		// const duelsInitialRank =
		// 	info.metadata.GameType === GameType.GT_PVPDR_PAID
		// 		? info.duelsInfo?.PaidRating
		// 		: info.metadata.GameType === GameType.GT_PVPDR
		// 		? info.duelsInfo?.Rating
		// 		: null;
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
		const newBgInfoWithRating: BattlegroundsInfo = !!newBgInfo
			? {
					...newBgInfo,
					NewRating: bgNewRating ?? newBgInfo.NewRating,
			  }
			: null;
		const [
			// battlegroundsInfoAfterGameOver,
			// The timing doesn't work, the diff is only computed later apparently, once the user is on the
			// end screen
			// Maybe this could be sent asynchronously via another API call, but for now I think it's
			// ok to not have the new rank
			//  duelsPlayerRankAfterGameOver,
			xpForGame,
		] = await Promise.all([
			// isBattlegrounds(info.metadata.GameType) ? this.getBattlegroundsEndGame() : null,
			// isDuels(info.metadata.GameType) ? this.getDuelsNewPlayerRank(duelsInitialRank, info.duelsInfo) : null,
			this.rewards.getXpForGameInfo(),
		]);
		console.log('[manastorm-bridge] read memory info');

		const augmentedInfo: UploadInfo = {
			...info,
			battlegroundsInfoAfterGameOver: newBgInfoWithRating,
			// duelsPlayerRankAfterGameOver: duelsPlayerRankAfterGameOver,
			xpForGame: xpForGame,
		};
		console.debug('[manastorm-bridge] augmentedInfo', augmentedInfo);
		await this.endGameUploader.upload2(augmentedInfo);
	}

	private async getBattlegroundsEndGame(): Promise<BattlegroundsInfo> {
		const result = await this.memoryInspection.getBattlegroundsEndGame();
		console.log('[manastorm-bridge] received BG rank result', result?.Rating, result?.NewRating);
		return result;
	}

	private async getDuelsNewPlayerRank(initialRank: number, existingDuelsInfo: DuelsInfo): Promise<number> {
		// Ideally should trigger this only when winning at 11 or losing at 2, but we don't have the match result yet
		// Could add it somewhere, but for now I think it's good enough like that
		if (existingDuelsInfo.Wins !== 11 && existingDuelsInfo.Losses !== 2) {
			return null;
		}
		// This only matters when a run is over, so we need to be careful no to take too much time
		let duelsInfo = await this.memoryInspection.getDuelsInfo();
		let retriesLeft = 10;
		while (!duelsInfo?.LastRatingChange && retriesLeft >= 0) {
			await sleep(500);
			duelsInfo = await this.memoryInspection.getDuelsInfo();
			retriesLeft--;
		}
		if (!duelsInfo) {
			return null;
		}
		return duelsInfo.LastRatingChange + initialRank;
	}
}
