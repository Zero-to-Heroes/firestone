import { MainWindowStoreEvent } from '../main-window-store-event';

export class VideoReplayDeletionRequestEvent implements MainWindowStoreEvent {
	constructor(stepId: string, videoPath: string) {
		this.stepId = stepId;
		this.videoPath = videoPath;
	}
	readonly stepId: string;
	readonly videoPath: string;

	public static eventName(): string {
		return 'VideoReplayDeletionRequestEvent';
	}

	public eventName(): string {
		return 'VideoReplayDeletionRequestEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
