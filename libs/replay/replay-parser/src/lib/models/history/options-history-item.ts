import { HistoryItem } from './history-item';
import { EnrichedTag } from '../parser/enriched-tag';

export class OptionsHistoryItem extends HistoryItem {
	readonly tag: EnrichedTag;

	constructor(tag: EnrichedTag, timestamp: number, index: number) {
		super(timestamp, index);
		this.tag = tag;
	}
}
