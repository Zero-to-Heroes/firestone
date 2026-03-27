import { HistoryItem } from './history-item';
import { MetaData } from '../parser/metadata';

export class MetadataHistoryItem extends HistoryItem {
	readonly meta: MetaData;

	constructor(meta: MetaData, timestamp: number, index: number) {
		super(timestamp, index);
		this.meta = meta;
	}
}
