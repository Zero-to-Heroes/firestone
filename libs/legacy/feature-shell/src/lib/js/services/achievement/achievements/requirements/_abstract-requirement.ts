import { RawRequirement } from '@firestone/achievements/common';
import { GameEvent } from '@firestone/game-state';
import { Requirement } from './_requirement';

export abstract class AbstractRequirement implements Requirement {
	individualResetEvents?: readonly string[];
	public abstract reset(): void;
	public abstract afterAchievementCompletionReset(): void;
	public abstract isCompleted(): boolean;
	public abstract test(gameEvent: GameEvent): void;

	public static initialize<T extends Requirement>(
		initFunction: (rawReq: RawRequirement) => T,
		rawReq: RawRequirement,
	): T {
		const req = initFunction(rawReq);
		req.individualResetEvents = rawReq.individualRestEvents;
		return req;
	}
}
