import { Injectable } from '@angular/core';
import { DuelsInfo } from '@models/memory/memory-duels';
import { BehaviorSubject, combineLatest, merge } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, tap } from 'rxjs/operators';
import { ArenaInfo } from '../../models/arena-info';
import { BattlegroundsInfo } from '../../models/battlegrounds-info';
import { GameEvent } from '../../models/game-event';
import { GameSettingsEvent } from '../../models/mainwindow/game-events/game-settings-event';
import { MatchInfo } from '../../models/match-info';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { BattlegroundsStoreService } from '../battlegrounds/store/battlegrounds-store.service';
import { DeckInfo, DeckParserService } from '../decktracker/deck-parser.service';
import { DungeonLootParserService } from '../decktracker/dungeon-loot-parser.service';
import { GameStateService } from '../decktracker/game-state.service';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { HsGameMetaData } from '../game-mode-data.service';
import { MercenariesMemoryCacheService } from '../mercenaries/mercenaries-memory-cache.service';
import { EndGameUploaderService, UploadInfo } from './end-game-uploader.service';
import { ManastormInfo } from './manastorm-info';

@Injectable()
export class EndGameListenerService {
	private currentDeckstring: string;
	private currentDeckname: string;
	private currentBuildNumber: number;
	private currentScenarioId: number;
	private currentGameMode: number;
	private bgsHasPrizes: boolean;
	private bgsCurrentRating: number;
	private bgsNewRating: number;
	private reviewId: string;

	private paramsMap: Map<
		string,
		{
			duelsInfo: DuelsInfo;
		}
	> = new Map();

	private uploadStarted$$ = new BehaviorSubject<boolean>(false);

	constructor(
		private gameEvents: GameEventsEmitterService,
		private events: Events,
		private deckService: DeckParserService,
		private endGameUploader: EndGameUploaderService,
		private gameState: GameStateService,
		private duelsMonitor: DungeonLootParserService,
		private bgsStore: BattlegroundsStoreService,
		private readonly mercsMemoryCache: MercenariesMemoryCacheService,
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
				this.endGameUploader.upload2(info);
				this.uploadStarted$$.next(!this.uploadStarted$$.value);
			});

		// this.events.on(Events.MEMORY_UPDATE).subscribe((event) => {
		// 	const changes: MemoryUpdate = event.data[0];
		// 	if (changes.BattlegroundsNewRating) {
		// 		this.bgsNewRating = changes.BattlegroundsNewRating;
		// 		console.log('[manastorm-bridge] assigned BGS new rating', this.bgsNewRating);
		// 	}
		// });
		// this.events.on(Events.DUELS_INFO_UPDATED).subscribe((event) => {
		// 	const info = event.data[0];
		// 	const reviewId = info.reviewId;
		// 	const duelsInfo = info.duelsInfo;
		// 	const existingParams = this.paramsMap.get(reviewId) ?? {};
		// 	const newParams = {
		// 		...existingParams,
		// 		duelsInfo: duelsInfo,
		// 	};
		// 	this.paramsMap.set(reviewId, newParams);
		// 	console.log('[manastorm-bridge] assigned new duels info', this.paramsMap);
		// });
		// // TODO: might be worth it to use a state machine here as well, in order to avoid mixing the data
		// // from different games
		// // Ideally all data would be queued until the service is back to its READY state
		// this.gameEvents.allEvents.subscribe(async (gameEvent: GameEvent) => {
		// 	switch (gameEvent.type) {
		// 		case GameEvent.GAME_START:
		// 			this.currentBuildNumber = undefined;
		// 			this.currentScenarioId = undefined;
		// 			this.currentGameMode = undefined;
		// 			this.bgsHasPrizes = undefined;
		// 			console.log('[manastorm-bridge] reset state info');
		// 			break;
		// 		case GameEvent.LOCAL_PLAYER:
		// 			this.listenToDeckUpdate();
		// 			break;
		// 		case GameEvent.MATCH_METADATA:
		// 			this.currentBuildNumber = gameEvent.additionalData.metaData.BuildNumber;
		// 			this.currentScenarioId = gameEvent.additionalData.metaData.ScenarioID;
		// 			this.currentGameMode = gameEvent.additionalData.metaData.GameType;
		// 			this.reviewId = await this.gameState.getCurrentReviewId();
		// 			if (this.paramsMap.size > 0) {
		// 				console.warn('getting new reviewId before being able to send the current info', this.paramsMap);
		// 			}
		// 			break;
		// 		case GameEvent.BATTLEGROUNDS_HERO_SELECTED:
		// 			this.bgsCurrentRating = this.bgsStore.state?.currentGame?.mmrAtStart;
		// 			console.debug(
		// 				'[manastorm-bridge]',
		// 				await this.gameState.getCurrentReviewId(),
		// 				'bgsCurrentRating',
		// 				this.bgsCurrentRating,
		// 			);
		// 			break;
		// 		case GameEvent.GAME_SETTINGS:
		// 			this.bgsHasPrizes = (gameEvent as GameSettingsEvent).additionalData?.battlegroundsPrizes;
		// 			console.debug('[manastorm-bridge] bgsHasPrizes', this.bgsHasPrizes);
		// 			break;
		// 		case GameEvent.GAME_END:
		// 			console.log('[manastorm-bridge] end game, uploading?');
		// 			if (gameEvent.additionalData.spectating) {
		// 				console.log('[manastorm-bridge] spectate game, not uploading');
		// 				return;
		// 			}
		// 			this.stopListenToDeckUpdates();
		// 			const duelsInfo = this.paramsMap.get(this.reviewId)?.duelsInfo;
		// 			console.log('[manastorm-bridge] retrieved duels info for review', duelsInfo);
		// 			console.debug(
		// 				'[manastorm-bridge] other info',
		// 				this.reviewId,
		// 				this.currentScenarioId,
		// 				this.currentBuildNumber,
		// 				this.currentGameMode,
		// 				this.currentDeckname,
		// 			);

		// 			// Keep the await / long processes here to a minimum, since
		// 			// we want to start reading all the important memory bits as soon
		// 			// as possible
		// 			await this.endGameUploader.upload(
		// 				gameEvent,
		// 				this.reviewId,
		// 				this.currentDeckstring,
		// 				this.currentDeckname,
		// 				this.currentBuildNumber,
		// 				this.currentScenarioId,
		// 				{
		// 					bgsInfo: {
		// 						hasPrizes: this.bgsHasPrizes,
		// 						currentRating: this.bgsCurrentRating,
		// 						newRating: this.bgsNewRating,
		// 					},
		// 					duelsInfo: {
		// 						wins: duelsInfo?.Wins,
		// 						losses: duelsInfo?.Losses,
		// 						rating: duelsInfo?.Rating,
		// 						paidRating: duelsInfo?.PaidRating,
		// 					},
		// 				},
		// 			);

		// 			this.paramsMap.delete(this.reviewId);
		// 			break;
		// 	}
		// });
	}

	// private listening: boolean;

	// private async listenToDeckUpdate(shouldLoop = true) {
	// 	console.log('[manastorm-bridge] listening to deck updates', shouldLoop);
	// 	await sleep(2000);
	// 	// This in fact doesn't work, because if the deckService still has a deck in memory from
	// 	// last game, it will be used instead of the current one.
	// 	this.listening = true;
	// 	const currentDeck = await Promise.race([this.deckService.getCurrentDeck(10000), this.listenerTimeout()]);
	// 	console.log('[manastorm-bridge] got currentDeck', currentDeck);
	// 	if (!currentDeck?.deckstring) {
	// 		if (!isBattlegrounds(this.currentGameMode) && !isMercenaries(this.currentGameMode)) {
	// 			console.warn('[manastorm-bridge] no deckstring found', this.currentGameMode);
	// 		}
	// 		return;
	// 	}
	// 	this.currentDeckstring = currentDeck.deckstring;
	// 	console.log('[manastorm-bridge] got local player info, adding deckstring', this.currentDeckstring, currentDeck);
	// 	// Don't normalize the deck name - it will be encoded during upload
	// 	this.currentDeckname = currentDeck?.name;

	// 	if (shouldLoop) {
	// 		// Wait for a while to make sure the deck has been parsed
	// 		await sleep(15_000);
	// 		this.listenToDeckUpdate(false);
	// 	}
	// }

	// private stopListenToDeckUpdates() {
	// 	this.listening = false;
	// }

	// private listenerTimeout(): Promise<any> {
	// 	return new Promise<any>((resolve) => {
	// 		const interval = setInterval(() => {
	// 			if (!this.listening) {
	// 				clearInterval(interval);
	// 				resolve(null);
	// 			}
	// 		}, 100);
	// 	});
	// }
}
