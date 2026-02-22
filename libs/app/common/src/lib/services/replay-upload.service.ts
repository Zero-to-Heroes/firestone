import { Injectable } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { ReplayUploadMetadata } from '@firestone-hs/replay-metadata';
import { Input as BgsComputeRunStatsInput } from '@firestone-hs/user-bgs-post-match-stats';
import {
	ENABLE_IN_GAME_REPLAY_FOR_ALL,
	LogListenerCacheService,
	PreferencesService,
} from '@firestone/shared/common/service';
import { Mutable, uuid } from '@firestone/shared/framework/common';
import { UserService } from '@firestone/shared/framework/core';
import { GameForUpload, ReplayMetadataBuilderService } from '@firestone/stats/services';
import * as S3 from 'aws-sdk/clients/s3';
import * as AWS from 'aws-sdk/global';
import * as JSZip from 'jszip';

const BUCKET_METADATA = 'com.zerotoheroes.batch';
const BUCKET_REPLAY = 'xml.firestoneapp.com';
const BUCKET_POWER_LOG = 'power.firestoneapp.com';

@Injectable({ providedIn: 'root' })
export class ReplayUploadService {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly userService: UserService,
		private readonly metadataBuilder: ReplayMetadataBuilderService,
		private readonly logListenerCache: LogListenerCacheService,
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

		// Now upload the full Power.log file, keeping only the last game
		if (fullMetaData.user.isPremium || ENABLE_IN_GAME_REPLAY_FOR_ALL) {
			const powerLogZip = new JSZip();
			const powerLog = await this.extractLastGameFromPowerLog(xml);
			console.debug('[manastorm-bridge] extracted last game from power log', powerLog);
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
			(fullMetaData.game as Mutable<ReplayUploadMetadata['game']>).powerLogKey = powerLogKey;
		}

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

	private async uploadPowerLog(powerLogKey: string, powerLogBlob: Blob) {
		return new Promise<void>(async (resolve, reject) => {
			const s3 = new S3();
			const body = await this.convertBlobToBody(powerLogBlob);
			const params = {
				Bucket: BUCKET_POWER_LOG,
				Key: powerLogKey,
				Body: body,
				ContentType: 'application/zip',
			};
			s3.makeUnauthenticatedRequest('putObject', params, async (err, data2) => {
				if (err) {
					console.error('[manastorm-bridge] An error during power log upload', err);
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

	private async extractLastGameFromPowerLog(xml: string): Promise<string> {
		const startTime = Date.now();
		const powerLog = await this.logListenerCache.cache['Power.log'].readFileContents();
		if (!powerLog) {
			console.warn('[manastorm-bridge] Power log is empty');
			return '';
		}

		const tsMatch = xml.match(/<Game ts="([^"]+)"/);
		if (!tsMatch) {
			console.warn('[manastorm-bridge] Could not find game timestamp in XML, returning full power log');
			return powerLog;
		}

		const gameTimestamp = tsMatch[1];
		const lines = powerLog.split('\n');
		let gameStartIndex = -1;

		// Search from the end for the last CREATE_GAME line matching the XML timestamp
		for (let i = lines.length - 1; i >= 0; i--) {
			if (lines[i].includes('GameState.DebugPrintPower() - CREATE_GAME')) {
				const logTsMatch = lines[i].match(/^D (\d+:\d+:\d+\.\d+)/);
				if (logTsMatch) {
					const logTs = logTsMatch[1];
					const minLen = Math.min(gameTimestamp.length, logTs.length);
					if (logTs.substring(0, minLen) === gameTimestamp.substring(0, minLen)) {
						gameStartIndex = i;
						break;
					}
				}
			}
		}

		// Fallback: use the last CREATE_GAME if no timestamp match was found
		if (gameStartIndex === -1) {
			console.warn(
				'[manastorm-bridge] Could not find game timestamp in power log, falling back to last CREATE_GAME',
				tsMatch,
			);
			for (let i = lines.length - 1; i >= 0; i--) {
				if (lines[i].includes('GameState.DebugPrintPower() - CREATE_GAME')) {
					gameStartIndex = i;
					break;
				}
			}
		}

		if (gameStartIndex === -1) {
			console.warn('[manastorm-bridge] Could not find CREATE_GAME in power log, returning full power log');
			return powerLog;
		}

		const result = lines.slice(gameStartIndex).join('\n');
		console.log('[manastorm-bridge] extracted last game from power log in', Date.now() - startTime, 'ms');
		return result;
	}
}
