import { GameForUpload } from '@firestone/stats/common';

export interface ManastormInfo {
	readonly type: 'new-review' | 'new-empty-review';
	readonly reviewId: string;
	readonly replayUrl: string;
	readonly game: GameForUpload;
}
