import { Injectable } from '@angular/core';

export interface ReplayPerfTimings {
	readonly reviewId?: string;
	readonly cacheHit?: boolean;
	readonly lambdaMs?: number;
	readonly downloadMs?: number;
	readonly unzipMs?: number;
	readonly cardsDbMs?: number;
	readonly entityMappingMs?: number;
	readonly firstTurnMs?: number;
	readonly fullParseMs?: number;
	readonly turnCount?: number;
	readonly xmlSizeBytes?: number;
}

type MutableReplayPerfTimings = {
	-readonly [K in keyof ReplayPerfTimings]: ReplayPerfTimings[K];
};

@Injectable({
	providedIn: 'root',
})
export class ReplayPerfService {
	private current: MutableReplayPerfTimings = {};
	private parseStartMs: number;
	private entityMappingStartMs: number;
	private firstTurnRecorded: boolean;

	public reset(reviewId?: string): void {
		this.current = reviewId ? { reviewId } : {};
		this.firstTurnRecorded = false;
	}

	public markCacheHit(hit: boolean): void {
		this.current.cacheHit = hit;
	}

	public markLambdaMs(ms: number): void {
		this.current.lambdaMs = ms;
	}

	public markDownloadMs(ms: number): void {
		this.current.downloadMs = ms;
	}

	public markUnzipMs(ms: number): void {
		this.current.unzipMs = ms;
	}

	public markCardsDbMs(ms: number): void {
		this.current.cardsDbMs = ms;
	}

	public markXmlSize(bytes: number): void {
		this.current.xmlSizeBytes = bytes;
	}

	public startParse(): void {
		this.parseStartMs = Date.now();
	}

	public startEntityMapping(): void {
		this.entityMappingStartMs = Date.now();
	}

	public endEntityMapping(): void {
		if (this.entityMappingStartMs) {
			this.current.entityMappingMs = Date.now() - this.entityMappingStartMs;
		}
	}

	public markFirstTurn(): void {
		if (!this.firstTurnRecorded && this.parseStartMs) {
			this.current.firstTurnMs = Date.now() - this.parseStartMs;
			this.firstTurnRecorded = true;
		}
	}

	public markTurnCount(count: number): void {
		this.current.turnCount = count;
	}

	public markFullParse(): ReplayPerfTimings {
		if (this.parseStartMs) {
			this.current.fullParseMs = Date.now() - this.parseStartMs;
		}
		return this.flush();
	}

	public flush(): ReplayPerfTimings {
		const result = { ...this.current } as ReplayPerfTimings;
		if (this.isEnabled()) {
			console.log('[replay-perf]', result);
		}
		return result;
	}

	public isEnabled(): boolean {
		if (typeof window === 'undefined') {
			return false;
		}
		try {
			return (
				localStorage.getItem('firestone-replay-perf') === 'true' ||
				new URLSearchParams(window.location.search).get('replayPerf') === 'true'
			);
		} catch {
			return false;
		}
	}
}
