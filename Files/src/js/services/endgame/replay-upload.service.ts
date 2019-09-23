import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import S3 from 'aws-sdk/clients/s3';
import AWS from 'aws-sdk/global';
import { OverwolfService } from '../overwolf.service';
import { GameForUpload } from './game-for-upload';

const REVIEW_INIT_ENDPOINT = 'https://husxs4v58a.execute-api.us-west-2.amazonaws.com/prod';
const BUCKET = 'com.zerotoheroes.batch';

@Injectable()
export class ReplayUploadService {
	constructor(private http: HttpClient, private ow: OverwolfService) {}

	public async uploadGame(game: GameForUpload): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			const user = await this.ow.getCurrentUser();
			const userId = user.userId || user.machineId || user.username || 'unauthenticated_user';

			// Build an empty review
			this.http.post(REVIEW_INIT_ENDPOINT, null).subscribe(res => {
				const reviewId: string = res as string;
				console.log('Created empty shell review', res, reviewId);

				const bytes = game.replayBytes;
				// http://stackoverflow.com/questions/35038884/download-file-from-bytes-in-javascript
				const byteArray = new Uint8Array(bytes);
				const blob = new Blob([byteArray], { type: 'application/zip' });
				const fileKey = Date.now() + '_' + reviewId + '.hszip';
				console.log('built file key', fileKey);

				// Configure The S3 Object
				AWS.config.region = 'us-west-2';
				AWS.config.httpOptions.timeout = 3600 * 1000 * 10;

				let rank = game.rank;
				if ('Arena' === game.gameMode) {
					if (game.arenaInfo) {
						rank = game.arenaInfo.Wins;
					} else {
						rank = null;
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
						'game-rank': rank && rank !== 'legend' ? rank.toString() : '',
						'game-legend-rank': rank === 'legend' ? rank.toString() : '',
						'opponent-game-rank':
							game.opponentRank && game.opponentRank !== 'legend' ? game.opponentRank.toString() : '',
						'opponent-game-legend-rank': game.opponentRank === 'legend' ? game.opponentRank.toString() : '',
						'game-mode': game.gameMode,
						'game-format': game.gameMode !== 'Arena' ? game.gameFormat : '',
						'deckstring': game.deckstring,
					},
				};
				console.log('uploading with params', params);
				s3.makeUnauthenticatedRequest('putObject', params, async (err, data2) => {
					// There Was An Error With Your S3 Config
					if (err) {
						console.warn('An error during upload', err);
						reject();
					} else {
						console.log('Uploaded game', data2, reviewId);
						game.reviewId = reviewId;
						resolve();
					}
				});
			});
		});
	}
}
