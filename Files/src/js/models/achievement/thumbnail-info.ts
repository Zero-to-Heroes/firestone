import { SafeUrl, SafeHtml } from '@angular/platform-browser';

export interface ThumbnailInfo {
	readonly timestamp: number;
	readonly completionDate: string;
	readonly videoLocation: string;
	readonly videoPath: string;
	readonly thumbnail: SafeUrl;
	readonly videoUrl: SafeUrl;
	readonly iconSvg: SafeHtml;
	readonly stepId: string;
	readonly isDeleted: boolean;
	inDeletion: boolean;
}
