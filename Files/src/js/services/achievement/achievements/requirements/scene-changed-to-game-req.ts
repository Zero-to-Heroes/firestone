import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class SceneChangedToGameReq implements Requirement {
	private sceneChanged: boolean;

	constructor() {}

	public static create(rawReq: RawRequirement): Requirement {
		return new SceneChangedToGameReq();
	}

	reset(): void {
		this.sceneChanged = undefined;
	}

	afterAchievementCompletionReset(): void {
		// Do nothing
	}

	isCompleted(): boolean {
		return this.sceneChanged;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.SCENE_CHANGED && gameEvent.additionalData.scene === 'scene_gameplay') {
			this.sceneChanged = true;
		}
	}
}
