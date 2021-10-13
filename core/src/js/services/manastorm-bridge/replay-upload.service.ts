import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import S3 from 'aws-sdk/clients/s3';
import AWS from 'aws-sdk/global';
import * as JSZip from 'jszip';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { uuid } from '../utils';
import { GameForUpload } from './game-for-upload';
import { ManastormInfo } from './manastorm-info';

const BUCKET = 'com.zerotoheroes.batch';

@Injectable()
export class ReplayUploadService {
	constructor(private http: HttpClient, private ow: OverwolfService, private readonly events: Events) {}

	public async uploadGame(game: GameForUpload) {
		if (!game.reviewId) {
			console.error('[manastorm-bridge] Could not upload game, no review id is associated to it');
			return;
		}

		console.log('[manastorm-bridge] uploading game');
		const user = await this.ow.getCurrentUser();
		console.log('[manastorm-bridge] retrieved current user');
		this.postFullReview(game.reviewId, user.userId, user.username, game);
	}

	private async postFullReview(reviewId: string, userId: string, userName: string, game: GameForUpload) {
		const jszip = new JSZip.default();
		console.debug('[manastorm-bridge] ready to zip');
		jszip.file('power.log', game.uncompressedXmlReplay);
		const blob: Blob = await jszip.generateAsync({
			type: 'blob',
			compression: 'DEFLATE',
			compressionOptions: {
				level: 9,
			},
		});
		const fileKey = Date.now() + '_' + reviewId + '.hszip';
		console.log('[manastorm-bridge] built file key', fileKey);

		// Configure The S3 Object
		AWS.config.region = 'us-west-2';
		AWS.config.httpOptions.timeout = 3600 * 1000 * 10;

		const s3 = new S3();
		const today = new Date();
		const replayKey = `hearthstone/replay/${today.getFullYear()}/${
			today.getMonth() + 1
		}/${today.getDate()}/${uuid()}.xml.zip`;
		const params = {
			Bucket: BUCKET,
			Key: fileKey,
			ACL: 'public-read-write',
			Body: blob,
			Metadata: {
				'review-id': reviewId,
				'replay-key': replayKey,
				'application-key': 'firestone',
				'user-key': userId,
				'username': userName,
				'file-type': 'hszip',
				'player-rank': game.playerRank != null ? '' + game.playerRank : '',
				'new-player-rank': game.newPlayerRank != null ? '' + game.newPlayerRank : '',
				'opponent-rank': game.opponentRank != null ? '' + game.opponentRank : '',
				'game-mode': game.gameMode,
				'game-format': game.gameFormat,
				'build-number': game.buildNumber ? '' + game.buildNumber : '',
				'deckstring': game.deckstring,
				'deck-name': game.deckName,
				'scenario-id': game.scenarioId ? '' + game.scenarioId : '',
				'should-zip': 'true',
				'app-version': '' + process.env.APP_VERSION,
				'available-races': game.availableTribes ? JSON.stringify(game.availableTribes) : undefined,
				'banned-races': game.bannedTribes ? JSON.stringify(game.bannedTribes) : undefined,
				'bgs-has-prizes': JSON.stringify(!!game.hasBgsPrizes),
				'duels-run-id': game.runId,
				'run-id': game.runId,
				'additional-result': game.additionalResult,
				'normalized-xp-gained': '' + game.xpForGame?.xpGainedWithoutBonus,
				'real-xp-gamed': '' + game.xpForGame?.realXpGained,
				'level-after-match': game.xpForGame ? game.xpForGame.currentLevel + '-' + game.xpForGame.currentXp : '',
				'mercs-bounty-id': '' + game.mercsBountyId,
			},
		};
		console.log('[manastorm-bridge] uploading with params', params);
		s3.makeUnauthenticatedRequest('putObject', params, async (err, data2) => {
			// There Was An Error With Your S3 Config
			if (err) {
				console.warn('[manastorm-bridge] An error during upload', err);
				// reject();
			} else {
				console.log('[manastorm-bridge] Uploaded game', reviewId);
				const info: ManastormInfo = {
					type: 'new-review',
					reviewId: reviewId,
					replayUrl: `https://replays.firestoneapp.com/?reviewId=${reviewId}`,
					game: game,
				};
				this.events.broadcast(Events.REVIEW_FINALIZED, info);
				// this.ow.setExtensionInfo(JSON.stringify(info));
			}
		});
	}
}
