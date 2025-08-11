import { Injectable } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { ReplayUploadMetadata } from '@firestone-hs/replay-metadata';
import { Input as BgsComputeRunStatsInput } from '@firestone-hs/user-bgs-post-match-stats';
import { PreferencesService } from '@firestone/shared/common/service';
import { UserService } from '@firestone/shared/framework/core';
import { GameForUpload, ReplayMetadataBuilderService } from '@firestone/stats/services';
import * as S3 from 'aws-sdk/clients/s3';
import * as AWS from 'aws-sdk/global';
import * as JSZip from 'jszip';

const BUCKET_METADATA = 'com.zerotoheroes.batch';
const BUCKET_REPLAY = 'xml.firestoneapp.com';

@Injectable({ providedIn: 'root' })
export class ReplayUploadService {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly userService: UserService,
		private readonly metadataBuilder: ReplayMetadataBuilderService,
	) {}

	public async uploadGame(
		game: GameForUpload,
		xml: string,
		bgsRunStats: BgsComputeRunStatsInput | null,
		comps: readonly BgsCompAdvice[] | null,
		appVersion: { app: string; version: string },
	): Promise<ReplayUploadMetadata | undefined> {
		if (!game.reviewId) {
			console.error('[manastorm-bridge] Could not upload game, no review id is associated to it');
			return undefined;
		}

		console.log('[manastorm-bridge] uploading game');
		// console.debug('[manastorm-bridge] uploading game', game);
		const user = await this.userService.getCurrentUser();
		if (!user) {
			console.error('[manastorm-bridge] Could not upload game, no user is associated to it');
			return undefined;
		}

		console.log('[manastorm-bridge] retrieved current user');
		return this.postFullReview(
			game.reviewId,
			user.userId!,
			user.username!,
			game,
			xml,
			bgsRunStats,
			comps,
			appVersion,
		);
	}

	private async postFullReview(
		reviewId: string,
		userId: string,
		userName: string,
		game: GameForUpload,
		xml: string,
		bgsRunStats: BgsComputeRunStatsInput | null,
		comps: readonly BgsCompAdvice[] | null,
		appVersion: { app: string; version: string },
	): Promise<ReplayUploadMetadata> {
		const prefs = await this.prefs.getPreferences();
		const start = Date.now();
		const fullMetaData = await this.metadataBuilder.buildMetadata(
			game,
			xml,
			bgsRunStats,
			comps,
			userId,
			userName,
			prefs.allowGamesShare,
			appVersion,
		);
		console.log('[manastorm-bridge] built metadata after', Date.now() - start, 'ms');
		console.debug('[manastorm-bridge] built metadata after', Date.now() - start, 'ms', fullMetaData);

		// Configure The S3 Object
		AWS.config.region = 'us-west-2';
		AWS.config.httpOptions!.timeout = 3600 * 1000 * 10;

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
		const userType = !fullMetaData.user?.userName?.length
			? 'anonymous'
			: fullMetaData.user.isPremium
				? 'premium'
				: 'loggedIn';
		await this.uploadReplay(replayKey, fileReplayBlob, {
			userType: userType,
		});

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
		return fullMetaData;
	}

	private async uploadReplay(replayKey: string, fileReplayBlob: Blob, tags: { userType: string }) {
		return new Promise<void>(async (resolve, reject) => {
			const s3 = new S3();
			// Convert Blob to Buffer in Node.js/Electron environment
			const body = await this.convertBlobToBody(fileReplayBlob);
			const params = {
				Bucket: BUCKET_REPLAY,
				Key: replayKey,
				ACL: 'public-read',
				Body: body,
				ContentType: 'application/zip',
				// Tagging: `userType=${tags.userType}`, // Shouldn't be used anywhere
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
		return new Promise<void>(async (resolve, reject) => {
			const s3 = new S3();
			// Convert Blob to Buffer in Node.js/Electron environment
			const body = await this.convertBlobToBody(metaDataBlob);
			const params = {
				Bucket: BUCKET_METADATA,
				Key: fileKey,
				ACL: 'public-read-write',
				Body: body,
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

	/**
	 * Converts a Blob to the appropriate format for AWS SDK.
	 * In Node.js/Electron, converts to Buffer. In browser, returns Blob as-is.
	 */
	private async convertBlobToBody(blob: Blob): Promise<Buffer | Blob> {
		// Check if we're in Node.js/Electron environment (Buffer is available)
		if (typeof Buffer !== 'undefined') {
			// Convert Blob to Buffer for Node.js/Electron
			const arrayBuffer = await blob.arrayBuffer();
			return Buffer.from(arrayBuffer);
		}
		// In browser environment, return Blob as-is
		return blob;
	}
}
