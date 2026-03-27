import { HistoryItem } from './history-item';
import { EntityTag } from '../parser/entity-tag';

export class TagChangeHistoryItem extends HistoryItem {
	readonly tag: EntityTag;

	constructor(tag: EntityTag, timestamp: number, index: number) {
		super(timestamp, index);
		this.tag = tag;
	}
}
