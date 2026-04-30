import { GameEvent } from '@firestone/game-state';

export interface Challenge {
	readonly achievementId: string;
	/** When true, {@link detect} must be considered for every game event. */
	readonly listensToAllGameEvents: boolean;
	/** Event types this challenge may react to; null when {@link listensToAllGameEvents} is true. */
	readonly interestedGameEventTypes: ReadonlySet<string> | null;

	isEligibleForMatch(gameType: number | undefined, scenarioId: number | undefined): boolean;
	detect(gameEvent: GameEvent, callback: () => void);
	getRecordPastDurationMillis(): number;
	getRecordingDuration(): number;
	notificationTimeout(): number;
	resetState(): void;
}
