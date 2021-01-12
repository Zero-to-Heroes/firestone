export interface EffectiveProgress {
	readonly id: string;
	readonly name: string;
	readonly text: string;
	readonly initialProgress: number;
	readonly currentProgress: number;
	readonly progressThisMatch: number;
	readonly quota: number;
	readonly completed: boolean;
}
