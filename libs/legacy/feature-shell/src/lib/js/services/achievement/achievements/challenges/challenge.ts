import { GameEvent } from '@firestone/game-state';

export interface Challenge {
	readonly achievementId: string;

	detect(gameEvent: GameEvent, callback: () => void);
	getRecordPastDurationMillis(): number;
	getRecordingDuration(): number;
	notificationTimeout(): number;
	resetState(): void;
}
