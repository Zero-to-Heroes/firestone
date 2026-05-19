import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiRunner } from '@firestone/shared/framework/core';
import { loadAsync } from 'jszip';
import { ReplayPerfService } from './replay-perf.service';
import { CachedReplayXml, ReplayXmlCacheService } from './replay-xml-cache.service';

const RETRIEVE_REVIEW_URL = 'https://itkmxena7k2kkmkgpevc6skcie0tlwmk.lambda-url.us-west-2.on.aws/';
const REPLAY_API = 'https://xml.firestoneapp.com/';

export interface ReplayReviewMetadata {
	readonly reviewId: string;
	readonly replayKey: string;
	readonly playerDecklist: string | null;
	readonly powerLogKey: string | null;
}

export interface LoadedReplayXml {
	readonly replayXml: string;
	readonly playerDecklist: string | null;
	readonly powerLogKey: string | null;
	readonly fromCache: boolean;
}

@Injectable({
	providedIn: 'root',
})
export class ReplayLoadService {
	constructor(
		private readonly api: ApiRunner,
		private readonly http: HttpClient,
		private readonly replayCache: ReplayXmlCacheService,
		private readonly replayPerf: ReplayPerfService,
	) {}

	public async loadReplayXml(reviewId: string, bustCache = false): Promise<LoadedReplayXml | null> {
		this.replayPerf.reset(reviewId);

		if (!bustCache) {
			const cached = await this.replayCache.get(reviewId);
			if (cached?.xml) {
				this.replayPerf.markCacheHit(true);
				return {
					replayXml: cached.xml,
					playerDecklist: cached.playerDecklist,
					powerLogKey: cached.powerLogKey,
					fromCache: true,
				};
			}
		}
		this.replayPerf.markCacheHit(false);

		const metadata = await this.fetchReviewMetadata(reviewId);
		if (!metadata?.replayKey) {
			return null;
		}

		const replayXml = await this.downloadReplayXml(metadata.replayKey, bustCache);
		if (!replayXml) {
			return null;
		}

		await this.replayCache.put({
			reviewId,
			replayKey: metadata.replayKey,
			xml: replayXml,
			playerDecklist: metadata.playerDecklist,
			powerLogKey: metadata.powerLogKey,
			fetchedAt: Date.now(),
			sizeBytes: replayXml.length,
		});

		return {
			replayXml,
			playerDecklist: metadata.playerDecklist,
			powerLogKey: metadata.powerLogKey,
			fromCache: false,
		};
	}

	public prefetchReplayXml(reviewId: string): void {
		void this.loadReplayXml(reviewId).catch((error) =>
			console.debug('[replay-load] prefetch failed', reviewId, error),
		);
	}

	private async fetchReviewMetadata(reviewId: string): Promise<ReplayReviewMetadata | null> {
		const lambdaStart = Date.now();
		const review: any = await this.api.callGetApi<any>(`${RETRIEVE_REVIEW_URL}/${reviewId}`);
		this.replayPerf.markLambdaMs(Date.now() - lambdaStart);
		if (!review) {
			return null;
		}
		return {
			reviewId,
			replayKey: review.replayKey,
			playerDecklist: review.playerDecklist ?? null,
			powerLogKey: review.powerLogKey ?? null,
		};
	}

	private async downloadReplayXml(replayKey: string, bustCache: boolean): Promise<string | null> {
		const downloadStart = Date.now();
		if (replayKey?.endsWith('.zip')) {
			const headers = new HttpHeaders({ 'Content-Type': 'application/zip' }).set('Accept', 'application/zip');
			const baseUrl = REPLAY_API + replayKey;
			const url = bustCache ? `${baseUrl}?ts=${Date.now()}` : baseUrl;
			const zippedReplay = await this.http.get(url, { headers, responseType: 'blob' }).toPromise();
			this.replayPerf.markDownloadMs(Date.now() - downloadStart);

			const unzipStart = Date.now();
			const zipContent = await loadAsync(zippedReplay as Blob);
			const file = Object.keys(zipContent.files)[0];
			const replay = await zipContent.file(file)?.async('string');
			this.replayPerf.markUnzipMs(Date.now() - unzipStart);
			return replay ?? null;
		}

		const headers = new HttpHeaders({ 'Content-Type': 'text/xml' }).set('Accept', 'text/xml');
		const replay = await this.http
			.get(REPLAY_API + replayKey, { headers, responseType: 'text' })
			.toPromise();
		this.replayPerf.markDownloadMs(Date.now() - downloadStart);
		return replay ?? null;
	}
}
