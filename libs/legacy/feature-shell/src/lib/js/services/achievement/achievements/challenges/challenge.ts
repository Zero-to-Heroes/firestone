import { GameEvent } from '../../../../models/game-event';

export interface Challenge {
	readonly achievementId: string;

	detect(gameEvent: GameEvent, callback: () => void);
	getRecordPastDurationMillis(): number;
	getRecordingDuration(): number;
	notificationTimeout(): number;
	resetState(): void;
}
