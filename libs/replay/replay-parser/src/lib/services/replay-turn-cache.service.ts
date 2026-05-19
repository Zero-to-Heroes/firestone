import { Injectable } from '@angular/core';
import { Map } from 'immutable';
import { Game } from '../models/game/game';
import { Entity } from '../models/game/entity';

export interface TurnCacheEntry {
	readonly chunkIndex: number;
	readonly turnCount: number;
	readonly endState: Map<number, Entity>;
}

@Injectable({
	providedIn: 'root',
})
export class ReplayTurnCacheService {
	private readonly cache = new Map<string, TurnCacheEntry>();
	private currentReviewKey: string | null = null;
	private lastProcessedChunk = -1;

	public reset(reviewKey: string): void {
		if (this.currentReviewKey !== reviewKey) {
			this.cache.clear();
			this.currentReviewKey = reviewKey;
			this.lastProcessedChunk = -1;
		}
	}

	public getLastProcessedChunk(): number {
		return this.lastProcessedChunk;
	}

	public markChunkProcessed(chunkIndex: number, game: Game): void {
		this.lastProcessedChunk = chunkIndex;
		this.cache.set(`${chunkIndex}`, {
			chunkIndex,
			turnCount: game.turns.size,
			endState: game.latestChunkEndState,
		});
	}

	public getParsedTurnCount(): number {
		const latest = this.cache.get(`${this.lastProcessedChunk}`);
		return latest?.turnCount ?? 0;
	}
}
