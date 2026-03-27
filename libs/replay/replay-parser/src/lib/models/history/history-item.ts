export abstract class HistoryItem {
	readonly timestamp: number;
	readonly index: number;

	constructor(timestamp: number, index: number) {
		this.timestamp = timestamp;
		this.index = index;
	}
}
