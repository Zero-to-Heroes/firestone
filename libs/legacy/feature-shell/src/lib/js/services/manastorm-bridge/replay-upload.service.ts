import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { GameForUpload, ReplayMetadataBuilderService } from '@firestone/stats/common';
import * as S3 from 'aws-sdk/clients/s3';
import * as AWS from 'aws-sdk/global';
import * as JSZip from 'jszip';
import { BgsRunStatsService } from '../battlegrounds/bgs-run-stats.service';

const BUCKET_METADATA = 'com.zerotoheroes.batch';
const BUCKET_REPLAY = 'xml.firestoneapp.com';

@Injectable()
export class ReplayUploadService {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly metadataBuilder: ReplayMetadataBuilderService,
		private readonly bgsRunStatsService: BgsRunStatsService,
	) {}

	public async uploadGame(game: GameForUpload, xml: string) {
		if (!game.reviewId) {
			console.error('[manastorm-bridge] Could not upload game, no review id is associated to it');
			return;
		}

		console.log('[manastorm-bridge] uploading game');
		// console.debug('[manastorm-bridge] uploading game', game);
		const user = await this.ow.getCurrentUser();
		console.log('[manastorm-bridge] retrieved current user');
		this.postFullReview(game.reviewId, user.userId, user.username, game, xml);
	}

	private async postFullReview(reviewId: string, userId: string, userName: string, game: GameForUpload, xml: string) {
		const prefs = await this.prefs.getPreferences();
		const start = Date.now();
		const bgsRunStats =
			game.gameMode === 'battlegrounds' || game.gameMode === 'battlegrounds-friendly'
				? this.bgsRunStatsService.buildInput(reviewId, game, game.bgGame, userId, userName)
				: null;
		const fullMetaData = await this.metadataBuilder.buildMetadata(
			game,
			xml,
			bgsRunStats,
			userId,
			userName,
			prefs.allowGamesShare,
		);
		console.log('[manastorm-bridge] built metadata after', Date.now() - start, 'ms');
		console.debug('[manastorm-bridge] built metadata after', Date.now() - start, 'ms', fullMetaData);

		// Configure The S3 Object
		AWS.config.region = 'us-west-2';
		AWS.config.httpOptions.timeout = 3600 * 1000 * 10;

		// First upload the replay file, then the metadata
		const replayFileZip = new JSZip();
		replayFileZip.file('replay.xml', xml);
		const fileReplayBlob: Blob = await replayFileZip.generateAsync({
			type: 'blob',
			compression: 'DEFLATE',
			compressionOptions: {
				level: 9,
			},
		});
		const replayKey = fullMetaData.game.replayKey;
		console.log('[manastorm-bridge] uploading replay', replayKey);
		await this.uploadReplay(replayKey, fileReplayBlob);

		// const fileToUpload = JSON.stringify(fullMetaData) + '\n' + game.uncompressedXmlReplay;
		// const fileToUpload = game.uncompressedXmlReplay;

		const metaDataZipFile = new JSZip();
		metaDataZipFile.file('power.log', JSON.stringify(fullMetaData));
		const metaDataBlob: Blob = await metaDataZipFile.generateAsync({
			type: 'blob',
			compression: 'DEFLATE',
			compressionOptions: {
				level: 9,
			},
		});
		const fileKey = fullMetaData.game.reviewId + '_' + fullMetaData.user.userId + '.hszip';
		console.log('[manastorm-bridge] built file key for meta data', fileKey);
		await this.uploadMetaData(fileKey, metaDataBlob);
		console.log('[manastorm-bridge] uploaded metadata');
	}

	private async uploadReplay(replayKey: string, fileReplayBlob: Blob) {
		return new Promise<void>((resolve, reject) => {
			const s3 = new S3();
			const params = {
				Bucket: BUCKET_REPLAY,
				Key: replayKey,
				ACL: 'public-read',
				Body: fileReplayBlob,
				ContentType: 'application/zip',
			};
			s3.makeUnauthenticatedRequest('putObject', params, async (err, data2) => {
				if (err) {
					console.error('[manastorm-bridge] An error during replay upload', err);
					reject();
				}
				resolve();
			});
		});
	}

	private async uploadMetaData(fileKey: string, metaDataBlob: Blob) {
		return new Promise<void>((resolve, reject) => {
			const s3 = new S3();
			const params = {
				Bucket: BUCKET_METADATA,
				Key: fileKey,
				ACL: 'public-read-write',
				Body: metaDataBlob,
				ContentType: 'application/zip',
			};
			s3.makeUnauthenticatedRequest('putObject', params, async (err, data2) => {
				if (err) {
					console.error('[manastorm-bridge] An error during metadata upload', err);
					reject();
				}
				resolve();
			});
		});
	}
}
