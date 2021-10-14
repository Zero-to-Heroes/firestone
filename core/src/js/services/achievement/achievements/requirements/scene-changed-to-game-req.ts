import { SceneMode } from '@firestone-hs/reference-data';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class SceneChangedToGameReq implements Requirement {
	private sceneChanged: boolean;

	public static create(rawReq: RawRequirement): Requirement {
		return new SceneChangedToGameReq();
	}

	reset(): void {
		this.sceneChanged = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.sceneChanged = undefined;
	}

	isCompleted(): boolean {
		return this.sceneChanged;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.SCENE_CHANGED_MINDVISION) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (gameEvent.additionalData.scene === SceneMode.GAMEPLAY) {
			this.sceneChanged = true;
		}
	}
}
