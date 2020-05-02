import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GameEvent } from '../../models/game-event';
import { DeckParserService } from '../decktracker/deck-parser.service';
import { GameStateService } from '../decktracker/game-state.service';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { OverwolfService } from '../overwolf.service';
import { EndGameUploaderService } from './end-game-uploader.service';
import { ReplayUploadService } from './replay-upload.service';

@Injectable()
export class EndGameListenerService {
	private currentGameId: string;
	private currentDeckstring: string;
	private currentDeckname: string;
	private currentBuildNumber: number;
	private currentScenarioId: string;
	// private currentReviewId: string;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private events: Events,
		private logger: NGXLogger,
		private deckService: DeckParserService,
		private endGameUploader: EndGameUploaderService,
		private gameState: GameStateService,
		private replayUpload: ReplayUploadService,
		private ow: OverwolfService,
	) {
		this.init();
	}

	private init(): void {
		this.logger.debug('[manastorm-bridge] stgarting end-game-listener init');
		this.events.on(Events.NEW_GAME_ID).subscribe(async event => {
			this.logger.debug('[manastorm-bridge] Received new game id event', event);
			this.currentGameId = event.data[0];
		});
		this.gameEvents.allEvents.subscribe(async (gameEvent: GameEvent) => {
			switch (gameEvent.type) {
				case GameEvent.GAME_START:
					// const isManastormRunning = await this.ow.isManastormRunning();
					// if (isManastormRunning) {
					// 	// Upload is handled by manastorm
					// 	this.logger.debug('[manastorm-bridge] Manastorm is running, no need to init empty review');
					// 	return;
					// }
					this.logger.debug('[manastorm-bridge] Creating empty review');
					const currentReviewId = await this.replayUpload.createEmptyReview();
					console.log('[manastorm-bridge] built currentReviewId', currentReviewId);
					const info = {
						type: 'new-empty-review',
						reviewId: currentReviewId,
					};
					this.events.broadcast(Events.REVIEW_INITIALIZED, info);
					this.ow.setExtensionInfo(JSON.stringify(info));
					break;
				case GameEvent.LOCAL_PLAYER:
					this.currentDeckstring = this.deckService.currentDeck.deckstring;
					// First remove the diacritics, then remove the weird unicode characters (deck names can't be fun!)
					this.currentDeckname = this.deckService.currentDeck.name
						?.normalize('NFKD')
						// Allow some characters
						?.replace(/[^\w^\{^\}^\[^\]$^/^\s]/g, '')
						?.replace(/[^\x20-\x7E]/g, '');
					break;
				case GameEvent.MATCH_METADATA:
					this.currentBuildNumber = gameEvent.additionalData.metaData.BuildNumber;
					this.currentScenarioId = gameEvent.additionalData.metaData.ScenarioID;
					break;
				case GameEvent.GAME_END:
					this.logger.debug('[manastorm-bridge] end game, uploading?');
					const reviewId = await this.gameState.getCurrentReviewId();
					this.events.broadcast(Events.GAME_END, reviewId);
					await this.endGameUploader.upload(
						gameEvent,
						reviewId,
						this.currentGameId,
						this.currentDeckstring,
						this.currentDeckname,
						this.currentBuildNumber,
						this.currentScenarioId,
					);
			}
		});
	}
}
