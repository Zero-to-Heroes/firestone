import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
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
