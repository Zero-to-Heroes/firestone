import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { GameForUpload, ReplayMetadataBuilderService } from '@firestone/stats/common';
import * as S3 from 'aws-sdk/clients/s3';
import * as AWS from 'aws-sdk/global';
import * as JSZip from 'jszip';
import { BgsRunStatsService } from '../battlegrounds/bgs-run-stats.service';

const BUCKET = 'com.zerotoheroes.batch';

@Injectable()
export class ReplayUploadService {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly metadataBuilder: ReplayMetadataBuilderService,
		private readonly bgsRunStatsService: BgsRunStatsService,
	) {}

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
		const prefs = await this.prefs.getPreferences();
		const start = Date.now();
		const bgsRunStats =
			game.gameMode === 'battlegrounds' || game.gameMode === 'battlegrounds-friendly'
				? this.bgsRunStatsService.buildInput(reviewId, game, game.bgGame, userId, userName)
				: null;
		const fullMetaData = await this.metadataBuilder.buildMetadata(
			game,
			bgsRunStats,
			userId,
			userName,
			prefs.allowGamesShare,
		);
		console.debug('[manastorm-bridge] built metadata after', Date.now() - start, 'ms', fullMetaData);
		const fileToUpload = JSON.stringify(fullMetaData) + '\n' + game.uncompressedXmlReplay;
		// const fileToUpload = game.uncompressedXmlReplay;

		const jszip = new JSZip();
		jszip.file('power.log', fileToUpload);
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

		const replayKey = fullMetaData.game.replayKey;
		const version = await this.ow.getAppVersion('lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob');
		const metadata = {
			'review-id': reviewId,
			'replay-key': replayKey,
			'application-key': `firestone-${version}`,
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
			'bgs-has-spells': JSON.stringify(!!game.hasBgsSpells),
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
			'bg-battle-odds': !!game.bgBattleOdds?.length ? JSON.stringify(game.bgBattleOdds) : '',
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
			}
		});
	}
}
