import { HistoryItem } from './history-item';
import { Choices } from '../parser/choices';

export class ChoicesHistoryItem extends HistoryItem {
	readonly choices: Choices;

	constructor(choices: Choices, timestamp: number, index: number) {
		super(timestamp, index);
		this.choices = choices;
	}
}
