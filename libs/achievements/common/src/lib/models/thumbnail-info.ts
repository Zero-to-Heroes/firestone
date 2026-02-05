export interface ThumbnailInfo {
	readonly timestamp: number;
	readonly completionDate: string;
	readonly videoLocation: string;
	readonly videoPath: string;
	readonly thumbnail: string;
	readonly videoUrl: string;
	readonly iconSvg: string;
	readonly stepId: string;
	readonly isDeleted: boolean;
	inDeletion: boolean;
}
