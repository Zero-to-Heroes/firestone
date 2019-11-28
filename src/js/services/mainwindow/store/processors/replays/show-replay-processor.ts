import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { Navigation } from '../../../../../models/mainwindow/navigation';
import { MatchDetail } from '../../../../../models/mainwindow/replays/match-detail';
import { ReplaysState } from '../../../../../models/mainwindow/replays/replays-state';
import { ShowReplayEvent } from '../../events/replays/show-replay-event';
import { Processor } from '../processor';

export class ShowReplayProcessor implements Processor {
	public async process(event: ShowReplayEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const selectedInfo = currentState.replays.allReplays.find(replay => replay.reviewId === event.reviewId);
		const matchDetail = Object.assign(new MatchDetail(), {
			replayInfo: selectedInfo,
		} as MatchDetail);
		const newState: ReplaysState = Object.assign(new ReplaysState(), currentState.replays, {
			selectedReplay: matchDetail,
			currentView: 'match-details',
		} as ReplaysState);
		console.log('showing replay', event, newState);
		return Object.assign(new MainWindowState(), currentState, {
			replays: newState,
			isVisible: true,
			currentApp: 'replays',
			navigation: Object.assign(new Navigation(), currentState.navigation, {
				text: new Date(selectedInfo.creationTimestamp).toLocaleDateString('en-US', {
					month: 'short',
					day: '2-digit',
					year: 'numeric',
				}),
				image: null,
			} as Navigation),
		} as MainWindowState);
	}
}
