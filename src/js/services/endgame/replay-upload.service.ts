import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import S3 from 'aws-sdk/clients/s3';
import AWS from 'aws-sdk/global';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { GameForUpload } from './game-for-upload';

const REVIEW_INIT_ENDPOINT = 'https://husxs4v58a.execute-api.us-west-2.amazonaws.com/prod';
const BUCKET = 'com.zerotoheroes.batch';

@Injectable()
export class ReplayUploadService {
	constructor(private http: HttpClient, private ow: OverwolfService, private readonly events: Events) {}

	public async createEmptyReview(): Promise<string> {
		return new Promise<string>(resolve => {
			this.createEmptyReviewInternal(reviewId => resolve(reviewId), 10);
		});
	}

	private createEmptyReviewInternal(callback, retriesLeft = 10) {
		if (retriesLeft < 0) {
			console.error('[manastorm-bridge] Could not create empty review');
			callback(null);
		}
		this.http.post(REVIEW_INIT_ENDPOINT, null).subscribe(
			res => {
				const reviewId: string = res as string;
				console.log('[manastorm-bridge] Created empty shell review', res, reviewId);
				callback(reviewId);
			},
			error => {
				setTimeout(() => this.createEmptyReviewInternal(callback, retriesLeft - 1), 1000);
			},
		);
	}

	public async uploadGame(game: GameForUpload) {
		const user = await this.ow.getCurrentUser();
		const userId = user.userId || user.machineId || user.username || 'unauthenticated_user';

		if (!game.reviewId) {
			console.error('[manastorm-bridge] Could not upload game, no review id is associated to it');
			return;
		}

		this.postFullReview(game.reviewId, userId, game);
	}

	private postFullReview(reviewId: string, userId: string, game: GameForUpload) {
		// https://stackoverflow.com/questions/35038884/download-file-from-bytes-in-javascript
		const bytes = game.replayBytes;
		const byteArray = new Uint8Array(bytes);
		const blob = new Blob([byteArray], { type: 'application/zip' });
		const fileKey = Date.now() + '_' + reviewId + '.hszip';
		console.log('[manastorm-bridge] built file key', fileKey);

		// Configure The S3 Object
		AWS.config.region = 'us-west-2';
		AWS.config.httpOptions.timeout = 3600 * 1000 * 10;

		let playerRank = game.playerRank;
		if ('Arena' === game.gameMode) {
			if (game.arenaInfo) {
				playerRank = game.arenaInfo.Wins;
			} else {
				playerRank = undefined;
			}
		}
		const s3 = new S3();
		const params = {
			Bucket: BUCKET,
			Key: fileKey,
			ACL: 'public-read-write',
			Body: blob,
			Metadata: {
				'review-id': reviewId,
				'application-key': 'overwolf',
				'user-key': userId,
				'file-type': 'hszip',
				'review-text': 'Created by [Overwolf](http://www.overwolf.com)',
				'player-rank': playerRank ? '' + playerRank : '',
				'opponent-rank': game.opponentRank ? '' + game.opponentRank : '',
				'game-mode': game.gameMode,
				'game-format': game.gameFormat,
				'build-number': game.buildNumber ? '' + game.buildNumber : '',
				'deckstring': game.deckstring,
				'deck-name': game.deckName,
				'scenario-id': game.scenarioId ? '' + game.scenarioId : '',
			},
		};
		console.log('[manastorm-bridge] uploading with params', params);
		s3.makeUnauthenticatedRequest('putObject', params, async (err, data2) => {
			// There Was An Error With Your S3 Config
			if (err) {
				console.warn('[manastorm-bridge] An error during upload', err);
				// reject();
			} else {
				console.log('[manastorm-bridge] Uploaded game', data2, reviewId);
				const info = {
					type: 'new-review',
					reviewId: reviewId,
					replayUrl: `http://replays.firestoneapp.com/?reviewId=${reviewId}`,
				};
				this.events.broadcast(Events.REVIEW_FINALIZED, info);
			}
		});
	}
}
