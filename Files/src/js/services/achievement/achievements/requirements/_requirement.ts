import { GameEvent } from '../../../../models/game-event';

export interface Requirement {
	reset(): void;
	// Used to reset the requirement after it's been completed. Some reqs should
	// reset their state (ie number of cards played in a turn), others should not
	// (ie reqs that track the game mode)
	afterAchievementCompletionReset(): void;
	isCompleted(): boolean;
	test(gameEvent: GameEvent): void;
}
