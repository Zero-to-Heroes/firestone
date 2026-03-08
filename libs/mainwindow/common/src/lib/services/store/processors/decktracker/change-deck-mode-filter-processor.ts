import {
	ChangeDeckModeFilterEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class ChangeDeckModeFilterProcessor implements Processor {
	public async process(
		event: ChangeDeckModeFilterEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		return [null, null];
	}
}
