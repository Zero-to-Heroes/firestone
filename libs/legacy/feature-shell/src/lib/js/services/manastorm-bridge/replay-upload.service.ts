import { Injectable } from '@angular/core';
import * as S3 from 'aws-sdk/clients/s3';
import * as AWS from 'aws-sdk/global';
import * as JSZip from 'jszip';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { uuid } from '../utils';
import { GameForUpload } from './game-for-upload';
import { ManastormInfo } from './manastorm-info';

const BUCKET = 'com.zerotoheroes.batch';

@Injectable()
export class ReplayUploadService {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly events: Events,
	) {
		const fakeGame: GameForUpload = {
			buildNumber: 139719,
			durationTimeSeconds: 0,
			durationTurns: 0,
			forceOpponentName: '已腐蚀的鱼人 (5 / 9)',
			gameFormat: 'wild',
			gameMode: 'mercenaries-pve',
			mercsBountyId: 168,
			newPlayerRank: undefined,
			opponent: undefined,
			opponentRank: undefined,
			player: undefined,
			playerRank: 'normal',
			result: 'won',
			reviewId: 'b87af202-23a3-4d54-b655-8bd51598e761',
			runId: '刷图-354877727-1383232357',
			scenarioId: 3790,
			title: '乐满满#5404 vs 乐满满#5404',
			uncompressedXmlReplay: '',
		} as GameForUpload;
		// window['debugUpload'] = () => this.uploadGame(fakeGame);
	}

	public async uploadGame(game: GameForUpload) {
		if (!game.reviewId) {
			console.error('[manastorm-bridge] Could not upload game, no review id is associated to it');
			return;
		}

		console.log('[manastorm-bridge] uploading game');
		// console.debug('[manastorm-bridge] uploading game', game);
		const user = await this.ow.getCurrentUser();
		console.log('[manastorm-bridge] retrieved current user');
		this.postFullReview(game.reviewId, user.userId, user.username, game);
	}

	private async postFullReview(reviewId: string, userId: string, userName: string, game: GameForUpload) {
		const jszip = new JSZip();
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

		const today = new Date();
		const replayKey = `hearthstone/replay/${today.getFullYear()}/${
			today.getMonth() + 1
		}/${today.getDate()}/${uuid()}.xml.zip`;
		const prefs = await this.prefs.getPreferences();
		const metadata = {
			'review-id': reviewId,
			'replay-key': replayKey,
			'application-key': 'firestone',
			'user-key': userId,
			username: userName,
			'file-type': 'hszip',
			'player-rank': game.playerRank != null ? '' + game.playerRank : '',
			'new-player-rank': game.newPlayerRank != null ? '' + game.newPlayerRank : '',
			'opponent-rank': game.opponentRank != null ? '' + game.opponentRank : '',
			'game-mode': game.gameMode,
			'game-format': game.gameFormat,
			'build-number': game.buildNumber ? '' + game.buildNumber : '',
			deckstring: game.deckstring,
			'deck-name': game.deckName ? encodeURIComponent(game.deckName) : null,
			'scenario-id': game.scenarioId ? '' + game.scenarioId : '',
			'should-zip': 'true',
			'app-version': '' + process.env.APP_VERSION,
			'app-channel': '' + process.env.APP_CHANNEL,
			'available-races': game.availableTribes ? JSON.stringify(game.availableTribes) : undefined,
			'banned-races': game.bannedTribes ? JSON.stringify(game.bannedTribes) : undefined,
			'bgs-has-prizes': JSON.stringify(!!game.hasBgsPrizes),
			'duels-run-id': encodeURIComponent(game.runId),
			'run-id': encodeURIComponent(game.runId),
			'additional-result': game.additionalResult,
			'normalized-xp-gained': '' + game.xpForGame?.xpGainedWithoutBonus,
			'real-xp-gamed': '' + game.xpForGame?.realXpGained,
			'level-after-match': game.xpForGame ? game.xpForGame.currentLevel + '-' + game.xpForGame.currentXp : '',
			'mercs-bounty-id': '' + game.mercsBountyId,
			// Because for mercs the player name from the replay isn't super interesting (Innkeeper), we build a
			// better name ourselves
			'force-opponent-name': encodeURIComponent(game.forceOpponentName),
			'allow-game-share': '' + prefs.allowGamesShare,
		};
		const params = {
			Bucket: BUCKET,
			Key: fileKey,
			ACL: 'public-read-write',
			Body: blob,
			Metadata: metadata,
		};
		console.log('no-format', '[manastorm-bridge] uploading with params', JSON.stringify(metadata));
		this.performReplayUpload(game, reviewId, params);
	}

	private performReplayUpload(game: GameForUpload, reviewId: string, params, retriesLeft = 5) {
		if (retriesLeft <= 0) {
			console.error('[manastorm-bridge] Could not upload replay', { ...game, uncompressedXmlReplay: '...' });
			return;
		}
		const s3 = new S3();
		s3.makeUnauthenticatedRequest('putObject', params, async (err, data2) => {
			// There Was An Error With Your S3 Config
			if (err) {
				console.warn('[manastorm-bridge] An error during upload', err);
				if (err.retryable) {
					this.performReplayUpload(game, reviewId, params, retriesLeft - 1);
					return;
				}
			} else {
				console.log('[manastorm-bridge] Uploaded game', reviewId);
				const info: ManastormInfo = {
					type: 'new-review',
					reviewId: reviewId,
					replayUrl: `https://replays.firestoneapp.com/?reviewId=${reviewId}`,
					game: game,
				};
				this.events.broadcast(Events.REVIEW_FINALIZED, info);
			}
		});
	}
}
