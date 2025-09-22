import { GameEvent } from '@firestone/shared/common/service';

export interface Challenge {
	readonly achievementId: string;

	detect(gameEvent: GameEvent, callback: () => void);
	getRecordPastDurationMillis(): number;
	getRecordingDuration(): number;
	notificationTimeout(): number;
	resetState(): void;
}
