import { SceneMode } from '@firestone-hs/reference-data';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { SceneChangedEvent } from '../events/scene-changed-event';
import { Processor } from './processor';

export class SceneChangedProcessor implements Processor {
	public async process(
		event: SceneChangedEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			currentState.update({
				currentScene: event.scene,
				lastNonGamePlayScene:
					event.scene === SceneMode.GAMEPLAY ? currentState.lastNonGamePlayScene : event.scene,
			}),
			null,
		];
	}
}
