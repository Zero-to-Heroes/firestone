import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { LiveStreamsService } from '../../../live-streams.service';
import { LiveStreamsForceReloadEvent } from '../../events/streams/live-streams-force-reload-event';

export class LiveStreamsForceReloadProcessor implements Processor {
	constructor(private readonly streamsService: LiveStreamsService) {}

	public async process(
		event: LiveStreamsForceReloadEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.streamsService.reloadLiveStreams();
		return [null, null];
	}
}
