import { Injectable } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { DuelsInfo } from '@models/memory/memory-duels';
import { BehaviorSubject, combineLatest, merge } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, tap } from 'rxjs/operators';
import { ArenaInfo } from '../../models/arena-info';
import { BattlegroundsInfo } from '../../models/battlegrounds-info';
import { GameEvent } from '../../models/game-event';
import { GameSettingsEvent } from '../../models/mainwindow/game-events/game-settings-event';
import { MatchInfo } from '../../models/match-info';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { isBattlegrounds } from '../battlegrounds/bgs-utils';
import { DeckInfo } from '../decktracker/deck-parser.service';
import { isDuels } from '../duels/duels-utils';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { HsGameMetaData } from '../game-mode-data.service';
import { MercenariesMemoryCacheService } from '../mercenaries/mercenaries-memory-cache.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { RewardMonitorService } from '../rewards/rewards-monitor';
import { sleep } from '../utils';
import { EndGameUploaderService, UploadInfo } from './end-game-uploader.service';
import { ManastormInfo } from './manastorm-info';

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
	) {
		this.init();
	}

	private init(): void {
		console.log('[manastorm-bridge] stgarting end-game-listener init');
		const metadata$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.MATCH_METADATA),
			map((event) => event.additionalData.metaData as HsGameMetaData),
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] metaData', info)),
		);
		const matchInfo$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.MATCH_INFO),
			map((event) => event.additionalData.matchInfo as MatchInfo),
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] matchInfo', info)),
		);
		const playerDeck$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.PLAYER_DECK_INFO),
			map((event) => event.additionalData.playerDeck as DeckInfo),
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] playerDeck', info)),
		);
		const duelsInfo$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.DUELS_INFO),
			map((event) => event.additionalData.duelsInfo as DuelsInfo),
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] duelsInfo', info)),
		);
		const arenaInfo$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.ARENA_INFO),
			map((event) => event.additionalData.arenaInfo as ArenaInfo),
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] arenaInfo', info)),
		);
		const mercsInfo$ = this.mercsMemoryCache.memoryMapInfo$.pipe(
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] mercsInfo', info)),
		);
		const mercsCollectionInfo$ = this.mercsMemoryCache.memoryCollectionInfo$.pipe(
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] mercsCollectionInfo', info)),
		);
		const bgInfo$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.BATTLEGROUNDS_INFO),
			map((event) => event.additionalData.bgInfo as BattlegroundsInfo),
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] bgInfo', info)),
		);
		const gameSettings$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.GAME_SETTINGS),
			map((event) => event as GameSettingsEvent),
			map((event) => event.additionalData),
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] gameSettings', info)),
		);
		// TODO: this won't work, as this is an information that we only get after the game is over
		const bgNewRating$ = this.events.on(Events.MEMORY_UPDATE).pipe(
			map((event) => event.data[0] as MemoryUpdate),
			filter((changes) => !!changes.BattlegroundsNewRating),
			map((changes) => changes.BattlegroundsNewRating),
			startWith(null),
			tap((info) => console.debug('[manastorm-bridge] bgNewRating', info)),
		);
		const reviewId$ = this.events.on(Events.REVIEW_INITIALIZED).pipe(
			map((event) => event.data[0] as ManastormInfo),
			filter((info) => !!info.reviewId),
			map((info) => info.reviewId),
			startWith(null),
			distinctUntilChanged(),
			tap((info) => console.debug('[manastorm-bridge] reviewId', info)),
		);
		// Doesn't work, reviewId arrives earlier
		const gameEnded$ = merge(
			this.gameEvents.allEvents.asObservable().pipe(filter((event) => event.type === GameEvent.GAME_END)),
			this.gameEvents.allEvents.asObservable().pipe(filter((event) => event.type === GameEvent.GAME_START)),
			this.uploadStarted$$,
		).pipe(
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
			tap((info) => console.debug('[manastorm-bridge] gameEnded', info)),
		);

		combineLatest(
			reviewId$,
			metadata$,
			gameEnded$,
			gameSettings$,
			// Groups of 6 max to have type inferrence
			combineLatest(mercsInfo$, mercsCollectionInfo$),
			combineLatest(matchInfo$, playerDeck$, duelsInfo$, arenaInfo$, bgInfo$, bgNewRating$),
		)
			.pipe(
				map(
					([
						reviewId,
						metadata,
						gameEnded,
						gameSettings,
						[mercsInfo, mercsCollectionInfo],
						[matchInfo, playerDeck, duelsInfo, arenaInfo, bgInfo, bgNewRating],
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
							// bgNewRating: bgNewRating,
						} as UploadInfo),
				),
				// We don't want to trigger anything unless the gameEnded status changed (to mark the end of
				// the current game) or the reviewId changed (to mark the start)
				distinctUntilChanged((a, b) => {
					// console.debug('[manastorm-bridge] comparing', a, b);
					return a?.reviewId === b?.reviewId && a?.gameEnded?.ended === b?.gameEnded?.ended;
				}),
				tap((info) => console.debug('[manastorm-bridge] triggering end game pipes')),
				filter((info) => !!info.reviewId && info.gameEnded.ended),
				tap((info) =>
					console.log('[manastorm-bridge] end game, uploading? spectating=', info.gameEnded.spectating),
				),
				filter((info) => !info.gameEnded.spectating),
				tap((info) => console.log('[manastorm-bridge] not a spectate game, continuing', info.metadata)),
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
		const duelsInitialRank =
			info.metadata.GameType === GameType.GT_PVPDR_PAID
				? info.duelsInfo?.PaidRating
				: info.metadata.GameType === GameType.GT_PVPDR
				? info.duelsInfo?.Rating
				: null;
		const [battlegroundsInfoAfterGameOver, duelsPlayerRankAfterGameOver, xpForGame] = await Promise.all([
			isBattlegrounds(info.metadata.GameType) ? this.getBattlegroundsEndGame() : null,
			isDuels(info.metadata.GameType) ? this.getDuelsNewPlayerRank(duelsInitialRank) : null,
			this.rewards.getXpForGameInfo(),
		]);
		console.log('[manastorm-bridge] read memory info');

		const augmentedInfo = {
			...info,
			battlegroundsInfoAfterGameOver: battlegroundsInfoAfterGameOver,
			duelsPlayerRankAfterGameOver: duelsPlayerRankAfterGameOver,
			xpForGame: xpForGame,
		};
		await this.endGameUploader.upload2(augmentedInfo);
	}

	private async getBattlegroundsEndGame(): Promise<BattlegroundsInfo> {
		const result = await this.memoryInspection.getBattlegroundsEndGame();
		console.log('[manastorm-bridge] received BG rank result', result);
		return result;
	}

	private async getDuelsNewPlayerRank(initialRank: number): Promise<number> {
		let duelsInfo = await this.memoryInspection.getDuelsInfo();
		let retriesLeft = 10;
		while (!duelsInfo?.LastRatingChange && retriesLeft >= 0) {
			await sleep(2000);
			duelsInfo = await this.memoryInspection.getDuelsInfo();
			retriesLeft--;
		}
		if (!duelsInfo) {
			return null;
		}
		return duelsInfo.LastRatingChange + initialRank;
	}
}
