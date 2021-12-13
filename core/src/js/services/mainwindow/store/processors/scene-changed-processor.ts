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
		console.debug('processing new scene', event.scene);
		return [
			currentState.update({
				currentScene: event.scene,
			}),
			null,
		];
	}
}
