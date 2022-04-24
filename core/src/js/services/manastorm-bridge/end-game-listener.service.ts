import { Injectable } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { DuelsInfo } from '@models/memory/memory-duels';
import { GameEvent } from '../../models/game-event';
import { GameSettingsEvent } from '../../models/mainwindow/game-events/game-settings-event';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { BattlegroundsStoreService } from '../battlegrounds/store/battlegrounds-store.service';
import { DeckParserService } from '../decktracker/deck-parser.service';
import { DungeonLootParserService } from '../decktracker/dungeon-loot-parser.service';
import { GameStateService } from '../decktracker/game-state.service';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { isMercenaries } from '../mercenaries/mercenaries-utils';
import { sleep } from '../utils';
import { EndGameUploaderService } from './end-game-uploader.service';

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

	constructor(
		private gameEvents: GameEventsEmitterService,
		private events: Events,
		private deckService: DeckParserService,
		private endGameUploader: EndGameUploaderService,
		private gameState: GameStateService,
		private duelsMonitor: DungeonLootParserService,
		private bgsStore: BattlegroundsStoreService,
	) {
		this.init();
	}

	private init(): void {
		console.log('[manastorm-bridge] stgarting end-game-listener init');
		this.events.on(Events.MEMORY_UPDATE).subscribe((event) => {
			const changes: MemoryUpdate = event.data[0];
			if (changes.BattlegroundsNewRating) {
				this.bgsNewRating = changes.BattlegroundsNewRating;
				console.log('[manastorm-bridge] assigned BGS new rating', this.bgsNewRating);
			}
		});
		this.events.on(Events.DUELS_INFO_UPDATED).subscribe((event) => {
			const info = event.data[0];
			const reviewId = info.reviewId;
			const duelsInfo = info.duelsInfo;
			const existingParams = this.paramsMap.get(reviewId) ?? {};
			const newParams = {
				...existingParams,
				duelsInfo: duelsInfo,
			};
			this.paramsMap.set(reviewId, newParams);
			console.log('[manastorm-bridge] assigned new duels info', this.paramsMap);
		});
		// TODO: might be worth it to use a state machine here as well, in order to avoid mixing the data
		// from different games
		// Ideally all data would be queued until the service is back to its READY state
		this.gameEvents.allEvents.subscribe(async (gameEvent: GameEvent) => {
			switch (gameEvent.type) {
				case GameEvent.GAME_START:
					this.currentBuildNumber = undefined;
					this.currentScenarioId = undefined;
					this.currentGameMode = undefined;
					this.bgsHasPrizes = undefined;
					console.log('[manastorm-bridge] reset state info');
					break;
				case GameEvent.LOCAL_PLAYER:
					this.listenToDeckUpdate();
					break;
				case GameEvent.MATCH_METADATA:
					this.currentBuildNumber = gameEvent.additionalData.metaData.BuildNumber;
					this.currentScenarioId = gameEvent.additionalData.metaData.ScenarioID;
					this.currentGameMode = gameEvent.additionalData.metaData.GameType;
					this.reviewId = await this.gameState.getCurrentReviewId();
					if (this.paramsMap.size > 0) {
						console.warn('getting new reviewId before being able to send the current info', this.paramsMap);
					}
					break;
				case GameEvent.BATTLEGROUNDS_HERO_SELECTED:
					this.bgsCurrentRating = this.bgsStore.state?.currentGame?.mmrAtStart;
					console.debug(
						'[manastorm-bridge]',
						await this.gameState.getCurrentReviewId(),
						'bgsCurrentRating',
						this.bgsCurrentRating,
					);
					break;
				case GameEvent.GAME_SETTINGS:
					this.bgsHasPrizes = (gameEvent as GameSettingsEvent).additionalData?.battlegroundsPrizes;
					console.debug('[manastorm-bridge] bgsHasPrizes', this.bgsHasPrizes);
					break;
				case GameEvent.GAME_END:
					console.log('[manastorm-bridge] end game, uploading?', gameEvent);
					if (gameEvent.additionalData.spectating) {
						console.log('[manastorm-bridge] spectate game, not uploading');
						return;
					}
					this.stopListenToDeckUpdates();
					const duelsInfo = this.paramsMap.get(this.reviewId)?.duelsInfo;
					console.log('[manastorm-bridge] retrieved duels info for review', duelsInfo);
					console.debug(
						'[manastorm-bridge] other info',
						this.reviewId,
						this.currentScenarioId,
						this.currentBuildNumber,
						this.currentGameMode,
						this.currentDeckname,
					);

					// Keep the await / long processes here to a minimum, since
					// we want to start reading all the important memory bits as soon
					// as possible
					await this.endGameUploader.upload(
						gameEvent,
						this.reviewId,
						this.currentDeckstring,
						this.currentDeckname,
						this.currentBuildNumber,
						this.currentScenarioId,
						{
							bgsInfo: {
								hasPrizes: this.bgsHasPrizes,
								currentRating: this.bgsCurrentRating,
								newRating: this.bgsNewRating,
							},
							duelsInfo: {
								wins: duelsInfo?.Wins,
								losses: duelsInfo?.Losses,
								rating: duelsInfo?.Rating,
								paidRating: duelsInfo?.PaidRating,
							},
						},
					);

					this.paramsMap.delete(this.reviewId);
					break;
			}
		});
	}

	private listening: boolean;

	private async listenToDeckUpdate() {
		console.log('[manastorm-bridge] listening to deck updates');
		// Wait for a while to make sure the deck has been parsed
		await sleep(15_000);
		// This in fact doesn't work, because if the deckService still has a deck in memory from
		// last game, it will be used instead of the current one.
		this.listening = true;
		const currentDeck = await Promise.race([this.deckService.getCurrentDeck(10000), this.listenerTimeout()]);
		console.log('[manastorm-bridge] got currentDeck', currentDeck);
		if (!currentDeck?.deckstring) {
			if (
				this.currentGameMode !== GameType.GT_BATTLEGROUNDS &&
				this.currentGameMode !== GameType.GT_BATTLEGROUNDS_FRIENDLY &&
				!isMercenaries(this.currentGameMode)
			) {
				console.warn('[manastorm-bridge] no deckstring found', this.currentGameMode);
			}
			return;
		}
		this.currentDeckstring = currentDeck.deckstring;
		console.log('[manastorm-bridge] got local player info, adding deckstring', this.currentDeckstring, currentDeck);
		// Don't normalize the deck name - it will be encoded during upload
		this.currentDeckname = currentDeck?.name;
	}

	private stopListenToDeckUpdates() {
		this.listening = false;
	}

	private listenerTimeout(): Promise<any> {
		return new Promise<any>((resolve) => {
			const interval = setInterval(() => {
				if (!this.listening) {
					clearInterval(interval);
					resolve(null);
				}
			}, 100);
		});
	}
}
