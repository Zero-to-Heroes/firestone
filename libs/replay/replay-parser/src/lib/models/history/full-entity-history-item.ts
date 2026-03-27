import { HistoryItem } from './history-item';
import { EntityDefinition } from '../parser/entity-definition';

export class FullEntityHistoryItem extends HistoryItem {
	readonly entityDefintion: EntityDefinition;

	constructor(entityDefintion: EntityDefinition, timestamp: number, index: number) {
		super(timestamp, index);
		this.entityDefintion = entityDefintion;
	}
}
