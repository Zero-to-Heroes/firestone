/**
 * TypeScript port of the HearthstoneReplays C# power.log parser.
 *
 * Parses Hearthstone power.log lines and emits GameEvent objects
 * that can be consumed directly by the Firestone app's state management.
 */
export class ReplayParser {
	private initialized = false;

	/**
	 * Callback invoked for each game event produced by the parser.
	 */
	public onGameEvent: ((event: GameEvent) => void) | null = null;

	/**
	 * Initialize the parser for real-time log processing.
	 */
	initRealtimeLogConversion(): void {
		this.initialized = true;
	}

	/**
	 * Process a single log line in real-time mode.
	 */
	readLine(line: string): void {
		// TODO: Phase 1 - implement line parsing pipeline
	}

	/**
	 * Process multiple log lines in real-time mode.
	 */
	readLines(lines: readonly string[]): void {
		for (const line of lines) {
			this.readLine(line);
		}
	}

	/**
	 * Parse a complete power.log from a list of lines (batch mode).
	 * Returns all events produced.
	 */
	fromString(lines: readonly string[]): GameEvent[] {
		const events: GameEvent[] = [];
		const previousCallback = this.onGameEvent;
		this.onGameEvent = (event) => events.push(event);
		this.initRealtimeLogConversion();
		this.readLines(lines);
		this.onGameEvent = previousCallback;
		return events;
	}
}

/**
 * Represents a game event emitted by the parser.
 * Mirrors the C# GameEvent structure for compatibility with the existing
 * event dispatch pipeline in game-events.service.ts.
 */
export interface GameEvent {
	readonly Type: string;
	readonly Value: Record<string, any>;
	readonly Debug?: GameEventDebug;
}

export interface GameEventDebug {
	readonly CreationLogLine?: string;
	readonly Timestamp?: string;
	readonly Index?: number;
}
