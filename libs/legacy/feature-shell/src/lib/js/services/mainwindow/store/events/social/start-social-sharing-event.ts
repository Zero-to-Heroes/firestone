import { SafeHtml } from '@angular/platform-browser';
import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class StartSocialSharingEvent implements MainWindowStoreEvent {
	constructor(network: string, videoPath: string, videoPathOnDisk: string, title: SafeHtml, achievementName: string) {
		this.network = network;
		this.videoPath = videoPath;
		this.videoPathOnDisk = videoPathOnDisk;
		this.title = title;
		this.achievementName = achievementName;
	}
	readonly network: string;
	readonly videoPath: string;
	readonly videoPathOnDisk: string;
	readonly title: SafeHtml;
	readonly achievementName: string;

	public static eventName(): string {
		return 'StartSocialSharingEvent';
	}

	public eventName(): string {
		return 'StartSocialSharingEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
