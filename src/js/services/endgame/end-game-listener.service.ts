import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GameEvent } from '../../models/game-event';
import { DeckParserService } from '../decktracker/deck-parser.service';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { EndGameUploaderService } from './end-game-uploader.service';
import { ReplayUploadService } from './replay-upload.service';

@Injectable()
export class EndGameListenerService {
	private currentGameId: string;
	private currentDeckstring: string;
	private currentDeckname: string;
	private currentBuildNumber: number;
	private currentScenarioId: string;
	private currentReviewId: string;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private events: Events,
		private logger: NGXLogger,
		private deckService: DeckParserService,
		private endGameUploader: EndGameUploaderService,
		private replayUpload: ReplayUploadService,
	) {
		this.init();
	}

	private init(): void {
		this.events.on(Events.NEW_GAME_ID).subscribe(async event => {
			this.logger.debug('[manastorm-bridge] Received new game id event', event);
			this.currentGameId = event.data[0];
			this.currentReviewId = await this.replayUpload.createEmptyReview();

			const info = {
				type: 'new-empty-review',
				reviewId: this.currentReviewId,
			};
			this.events.broadcast(Events.REVIEW_INITIALIZED, info);
		});
		this.gameEvents.allEvents.subscribe(async (gameEvent: GameEvent) => {
			switch (gameEvent.type) {
				case 'LOCAL_PLAYER':
					this.currentDeckstring = this.deckService.currentDeck.deckstring;
					this.currentDeckname = this.deckService.currentDeck.name;
					break;
				case 'MATCH_METADATA':
					this.currentBuildNumber = gameEvent.additionalData.metaData.BuildNumber;
					this.currentScenarioId = gameEvent.additionalData.metaData.ScenarioID;
					break;
				case 'GAME_END':
					this.logger.debug('[manastorm-bridge] end game, uploading?');
					await this.endGameUploader.upload(
						gameEvent,
						this.currentReviewId,
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
