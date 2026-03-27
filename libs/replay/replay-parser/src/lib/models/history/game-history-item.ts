import { EntityDefinition } from '../parser/entity-definition';
import { HistoryItem } from './history-item';

export class GameHistoryItem extends HistoryItem {
	readonly entityDefintion: EntityDefinition;
	readonly buildNumber: number;
	readonly gameType: number;
	readonly formatType: number;
	readonly scenarioID: number;

	constructor(entityDefintion: EntityDefinition, timestamp: number, index: number) {
		super(timestamp, index);
		this.entityDefintion = entityDefintion;
	}
}
