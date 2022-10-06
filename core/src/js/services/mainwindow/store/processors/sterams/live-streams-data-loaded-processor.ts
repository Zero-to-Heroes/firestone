import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { LiveStreamsDataLoadedEvent } from '../../events/streams/live-streams-data-loaded-event';

export class LiveStreamsDataLoadedProcessor implements Processor {
	public async process(
		event: LiveStreamsDataLoadedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState = currentState.update({
			streams: currentState.streams.update({
				liveStreamsData: event.data,
			}),
		});
		return [newState, null];
	}
}
