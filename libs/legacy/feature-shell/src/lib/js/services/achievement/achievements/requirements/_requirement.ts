import { GameEvent } from '@firestone/shared/common/service';

export interface Requirement {
	individualResetEvents?: readonly string[];

	reset(): void;
	// Used to reset the requirement after it's been completed. All reqs should be reset,
	// unless one achievement can be unlocked multiple times in a run
	afterAchievementCompletionReset(): void;
	isCompleted(): boolean;
	test(gameEvent: GameEvent): void;
}
