import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PowerLogBufferService {
	private lines: string[] = [];
	private gameStartIndex = 0;
	private pendingGameStartIndex = -1;
	private gameGeneration = 0;

	pushLine(line: string): void {
		if (line === 'truncated') {
			this.lines = [];
			this.gameStartIndex = 0;
			this.pendingGameStartIndex = -1;
			return;
		}
		this.lines.push(line);
		if (line.includes('GameState.DebugPrintPower() - CREATE_GAME')) {
			this.pendingGameStartIndex = this.lines.length - 1;
		}
	}

	/**
	 * Called when the C# parser confirms a genuinely new game (not a reconnect).
	 * Trims all lines before the pending CREATE_GAME.
	 */
	confirmNewGame(): void {
		if (this.pendingGameStartIndex >= 0) {
			this.lines = this.lines.slice(this.pendingGameStartIndex);
			this.gameStartIndex = 0;
			this.pendingGameStartIndex = -1;
			this.gameGeneration++;
		}
	}

	/**
	 * Called when the C# parser detects a reconnect.
	 * Discards the pending start — the original game start remains valid.
	 */
	confirmReconnect(): void {
		this.pendingGameStartIndex = -1;
	}

	getCurrentGameLog(): { log: string; generation: number } {
		return {
			log: this.lines.slice(this.gameStartIndex).join('\n'),
			generation: this.gameGeneration,
		};
	}

	/**
	 * Called after a successful upload. Frees the uploaded game's lines unless
	 * a new game has already started (in which case confirmNewGame already trimmed them).
	 */
	clearAfterUpload(generation: number): void {
		if (generation !== this.gameGeneration) {
			return;
		}
		if (this.pendingGameStartIndex >= 0) {
			// A new CREATE_GAME was seen but not yet confirmed as new game or reconnect.
			// Keep those lines, only discard the ones before.
			this.lines = this.lines.slice(this.pendingGameStartIndex);
			this.pendingGameStartIndex = 0;
		} else {
			this.lines = [];
		}
		this.gameStartIndex = 0;
	}
}
