import { HistoryItem } from './history-item';
import { ChosenTag } from '../parser/chosen-tag';

export class ChosenEntityHistoryItem extends HistoryItem {
	readonly tag: ChosenTag;

	constructor(tag: ChosenTag, timestamp: number, index: number) {
		super(timestamp, index);
		this.tag = tag;
	}
}
