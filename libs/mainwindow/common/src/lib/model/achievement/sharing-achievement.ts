import { SafeHtml } from '@angular/platform-browser';

export class SharingAchievement {
	readonly title: SafeHtml;
	readonly videoPath: string;
	readonly videoPathOnDisk: string;
	readonly network: string;
	readonly achievementName: string;
}
