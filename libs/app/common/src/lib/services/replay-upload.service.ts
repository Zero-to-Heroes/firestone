import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { BnetRegion } from '@firestone-hs/reference-data';
import { ReplayUploadMetadata } from '@firestone-hs/replay-metadata';
import { Input as BgsComputeRunStatsInput } from '@firestone-hs/user-bgs-post-match-stats';
import { ModsManagerService } from '@firestone/mods/common';
import {
	ENABLE_IN_GAME_REPLAY_FOR_ALL,
	PowerLogBufferService,
	PreferencesService,
} from '@firestone/shared/common/service';
import { Mutable, uuid } from '@firestone/shared/framework/common';
import { UserService } from '@firestone/shared/framework/core';
import { GameForUpload, ReplayMetadataBuilderService } from '@firestone/stats/services';
import { FetchHttpHandler } from '@smithy/fetch-http-handler';
import * as JSZip from 'jszip';

const BUCKET_METADATA = 'com.zerotoheroes.batch';
const BUCKET_REPLAY = 'xml.firestoneapp.com';
const BUCKET_POWER_LOG = 'power.firestoneapp.com';

function createAnonymousS3Client(): S3Client {
	return new S3Client({
		region: 'us-west-2',
		credentials: { accessKeyId: '', secretAccessKey: '' },
		signer: { sign: async (request) => request },
		// Fetch works in browser and Electron main (unlike XHR, which is browser-only)
		requestHandler: new FetchHttpHandler({
			requestTimeout: 3600 * 1000 * 10,
		}),
	});
}

@Injectable({ providedIn: 'root' })
export class ReplayUploadService {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly userService: UserService,
		private readonly metadataBuilder: ReplayMetadataBuilderService,
		private readonly powerLogBuffer: PowerLogBufferService,
		private readonly modsManager: ModsManagerService,
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

		const replayKey = fullMetaData.game.replayKey;
		const userType = !fullMetaData.user?.userName?.length
			? 'anonymous'
			: fullMetaData.user.isPremium
				? 'premium'
				: 'loggedIn';
		const currentRegion = fullMetaData.meta.region;
		const shouldUploadFromRegion = currentRegion !== BnetRegion.REGION_CN || this.modsManager.hasReplayViewer();
		const shouldUploadPowerLog =
			shouldUploadFromRegion && (fullMetaData.user.isPremium || ENABLE_IN_GAME_REPLAY_FOR_ALL);

		const replayUploadPromise = (async () => {
			const replayFileZip = new JSZip();
			replayFileZip.file('replay.xml', xml);
			const fileReplayBlob: Blob = await replayFileZip.generateAsync({
				type: 'blob',
				compression: 'DEFLATE',
				compressionOptions: {
					level: 9,
				},
			});
			console.log('[manastorm-bridge] uploading replay', replayKey);
			await this.uploadReplay(replayKey, fileReplayBlob, { userType });
			console.log('[manastorm-bridge] uploaded replay');
		})();

		const powerLogUploadPromise = shouldUploadPowerLog
			? (async () => {
					const { log: powerLog, generation } = this.powerLogBuffer.getCurrentGameLog();
					console.log('[manastorm-bridge] got power log from buffer, length', powerLog.length);
					console.debug('[manastorm-bridge] got power log from buffer', powerLog);
					const powerLogZip = new JSZip();
					powerLogZip.file('power.log', powerLog);
					const powerLogBlob: Blob = await powerLogZip.generateAsync({
						type: 'blob',
						compression: 'DEFLATE',
						compressionOptions: {
							level: 9,
						},
					});
					const powerLogKey = userType + '/' + uuid() + '.power.zip';
					console.log('[manastorm-bridge] uploading power log', powerLogKey);
					await this.uploadPowerLog(powerLogKey, powerLogBlob);
					console.log('[manastorm-bridge] uploaded power log');
					this.powerLogBuffer.clearAfterUpload(generation);
					(fullMetaData.game as Mutable<ReplayUploadMetadata['game']>).powerLogKey = powerLogKey;
				})()
			: Promise.resolve();

		await Promise.all([replayUploadPromise, powerLogUploadPromise]);

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
		const s3 = createAnonymousS3Client();
		const body = await this.convertBlobToBody(fileReplayBlob);
		await s3.send(
			new PutObjectCommand({
				Bucket: BUCKET_REPLAY,
				Key: replayKey,
				ACL: 'public-read',
				Body: body,
				ContentType: 'application/zip',
			}),
		);
	}

	private async uploadPowerLog(powerLogKey: string, powerLogBlob: Blob) {
		const s3 = createAnonymousS3Client();
		const body = await this.convertBlobToBody(powerLogBlob);
		await s3.send(
			new PutObjectCommand({
				Bucket: BUCKET_POWER_LOG,
				Key: powerLogKey,
				Body: body,
				ContentType: 'application/zip',
				Tagging: 'accessed=false',
			}),
		);
	}

	private async uploadMetaData(fileKey: string, metaDataBlob: Blob) {
		const s3 = createAnonymousS3Client();
		const body = await this.convertBlobToBody(metaDataBlob);
		await s3.send(
			new PutObjectCommand({
				Bucket: BUCKET_METADATA,
				Key: fileKey,
				// Anonymous uploads are owned by the "anonymous" S3 user; without this ACL
				// the bucket owner (and the lambdas reading the metadata) could not read the object
				ACL: 'bucket-owner-full-control',
				Body: body,
				ContentType: 'application/zip',
			}),
		);
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
